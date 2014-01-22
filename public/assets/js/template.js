/////////////////////
// CAROUSEL MODELS //
/////////////////////

function carousel_model(carousel) {

    // members
    this.id = ko.observable();
    this.order = ko.observable();
    this.image = ko.observable();
    this.website = ko.observable();
    this.title = ko.observable();
    this.text = ko.observable();

    // initialize
    ko.mapping.fromJS(carousel, {
        'include': [
            'order',
            'image',
            'website',
            'title',
            'text'
        ]
    }, this);

}

/////////////////////
// GDMRADIO MODELS //
/////////////////////

// gdmradio player
function gdmradio_player_model() {

    // members
    this.status = ko.observable();
    this.buffering = ko.observable(false);
    this.playing = ko.observable(false);
    // create audio
    this.audio = new Audio();
    this.buffer_seconds = 5000;

    // add event listener for playing
    this.audio.addEventListener('play', function() {
        this.playing(true);
    }.bind(this));

    // css
    this.css = ko.computed(function() {
        if (this.buffering())
            return 'glyphicon-transfer';
        else if (!this.playing())
            return 'glyphicon-play';
        else
            return 'glyphicon-stop';
    }.bind(this));

    // poll
    this.poll = function() {
        $.ajax({
            url: 'http://cloudcast.gdmradio.com/service/status.json',
            dataType: "json",
            crossDomain: true,
            success: function (status_js) {
                if (!this.status())
                    this.status(new status_model(status_js));
                else
                    this.status().update(status_js);
            }.bind(this)
        });
    }.bind(this);

    // listen
    this.listen = function() {
        window.location = "#gdmradio-listen"
        $('#gdmradio-listen').effect('pulsate');
    };

    // load
    this.buffer = function(play) {

        // set source
        this.audio.src = 'http://icecast.gdmradio.com:8000/128.mp3';
        // load source
        this.audio.load();
        // set buffering
        this.buffering(true);
        // set audio available after a small time
        setTimeout(function() {
            // done buffering
            this.buffering(false);
            // auto-play
            if (play) {
                // play audio (will fire playing above)
                this.audio.play();
            }
        }.bind(this), this.buffer_seconds);

    }.bind(this);

    // stop
    this.stop = function() {
        // set source empty
        this.audio.pause();
        this.audio.src = "";
        // set not playing and not buffering
        this.playing(false);
        this.buffering(false);
    }.bind(this);

    // play
    this.play = function() {
        // make sure we are not buffering
        if (this.buffering())
            return;
        // if not playing, buffer
        if (!this.playing())
            this.buffer(true);
        else
            this.stop();
    }.bind(this);

    // buffer & play
    this.buffer(true);
    // poll engine for status
     setInterval(function() {
         this.poll();
     }.bind(this), 5000);
     // initial poll
     this.poll();


};

/////////////////
// POST MODELS //
/////////////////

// post comment
function post_comment_model(post_comment) {

    // members
    this.id = ko.observable();
    this.commented_on = ko.observable();
    this.comment = ko.observable();
    this.user_id = ko.observable();

    // initialize
    ko.mapping.fromJS(post_comment, {
        'include': [ 'comment' ]
    }, this);

};

// post form
function post_form_model() {

    // members
    this.post = ko.observable();
    this.saving = ko.observable(false);
    this.errors = ko.observable();

    // refresh
    this.refresh = function() {
        // get post from url
        $.post(document.URL + '.json', function (post) {
            if (!post) return;
            this.post(new post_model(post));
        }.bind(this));
    }.bind(this);

    // save
    this.save = function() {
        // verify not already saving
        if (this.saving()) return;
        // set saving
        this.saving(true);
        // save stream
        $.post(document.URL + '.json', ko.mapping.toJSON(this.post()), function (data, status, request) {
                // check for validation errors
                if (request.getResponseHeader('errors')) {
                    this.errors(data);
                    this.saving(false);
                } else {
                    // redirect to shows
                    window.location = '/posts';
                }
            }.bind(this)).fail(function() {
                this.saving(false);
            }.bind(this));
    }.bind(this);

    // cancel
    this.cancel = function() {
        window.location = '/posts';
    };

    // initialize
    this.refresh();

}

// post
function post_model(post) {

    // members
    this.id = ko.observable();
    this.posted_on = ko.observable();
    this.title = ko.observable();
    this.image = ko.observable();
    this.summary = ko.observable();
    this.text = ko.observable('');
    this.user_id = ko.observable();
    this.post_comments = ko.observableArray();

    // initialize
    ko.mapping.fromJS(post, {
        'include': [
            'title',
            'image',
            'summary',
            'text'
        ]
    }, this);

};

// post view
function post_view_model() {

    // members
    this.post = ko.observable();
    this.post_comment = ko.observable(new post_comment_model());
    this.commenting = ko.observable(false);
    this.errors = ko.observable();

    // refresh
    this.refresh = function() {
        // get stream from url
        $.post(document.URL + '.json', function (post) {
            if (!post) return;
            this.post(new post_model(post));
        }.bind(this));
    }.bind(this);

    // save
    this.comment = function() {
        // verify not already commenting
        if (this.commenting()) return;
        // set commenting
        this.commenting(true);
        // save post comment
        $.post('/posts/comment/' + this.post().id() + '.json', ko.mapping.toJSON(this.post_comment()), function (data, status, request) {
            // check for validation errors
            if (request.getResponseHeader('errors')) {
                this.errors(data);
            } else {
                // add to post comments
                this.post().post_comments.unshift(new post_comment_model(data));
                // clear editor
                this.post_comment().comment('');
            }
            // set not commenting
            this.commenting(false);
        }.bind(this)).fail(function() {
            this.commenting(false);
        }.bind(this));
    }.bind(this);

    // initialize
    this.refresh();

}

/////////////////
// SHOW MODELS //
/////////////////

// show day
function show_day_model(show_day) {
    ko.mapping.fromJS(show_day, {
        'shows': {
            create: function(options) {
                var show = new show_model(options.data);
                show.show_full_date(false);
                return show;
            }
        }
    }, this);
};

// shows index model
function shows_index_model() {

    // members
    this.single_shows = ko.observableArray();
    this.repeat_days = ko.observableArray();

    // refresh
    this.refresh = function() {

        // get single shows
        $.get('http://cloudcast.gdmradio.com/service/single_shows.json', function (singles_shows) {
            if (!singles_shows) return;
            ko.utils.arrayForEach(singles_shows, function(singles_show) {
                this.single_shows.push(new show_model(singles_show));
            }.bind(this));
        }.bind(this));
        // get repeat shows days
        $.get('http://cloudcast.gdmradio.com/service/show_repeat_days.json', function (repeat_days) {
            if (!repeat_days) return;
            ko.utils.arrayForEach(repeat_days, function(repeat_day) {
                this.repeat_days.push(new show_day_model(repeat_day));
            }.bind(this));
        }.bind(this));

    };

    // scroll to a day
    this.scroll_to_day = function(repeat_day) {
        $('html, body').animate({
            scrollTop: $('#' + repeat_day.day()).offset().top - 50
        }, 1000);
    }

    // initialize
    this.refresh();

};

// show
function show_model(show) {
    this.show_full_date = ko.observable(true);
    ko.mapping.fromJS(show, {}, this);
};

///////////////////
// STATUS MODELS //
///////////////////

// status
function status_model(status) {

    // standard members
    this.current_file_artist = ko.observable();
    this.current_file_title = ko.observable();
    // max string length
    this.max_string_length = 20;

    // update
    this.update = function(status) {
        // truncate artist
        if (status.current_file_artist.length > this.max_string_length)
            status.current_file_artist = status.current_file_artist.substring(0, this.max_string_length) + '...';
        // truncate artist
        if (status.current_file_title.length > this.max_string_length)
            status.current_file_title = status.current_file_title.substring(0, this.max_string_length) + '...';
        // mapping
        ko.mapping.fromJS(status, null, this);
    }.bind(this);

    // initialize
    this.update(status);

};

////////////////////
// WELCOME MODELS //
////////////////////

function welcome_form_model() {

    // members
    this.carousels = ko.observableArray();
    this.saving = ko.observable(false);
    this.errors = ko.observable();

    // refresh
    this.refresh = function() {
        // get post from url
        $.post(document.URL + '.json', function (carousels) {
            if (!carousels) return;
            this.carousels.removeAll();
            ko.utils.arrayForEach(carousels, function(carousel) {
                this.carousels.push(new carousel_model(carousel));
            }.bind(this));
        }.bind(this));
    }.bind(this);

    // save
    this.save = function() {
        // verify not already saving
        if (this.saving()) return;
        // set saving
        this.saving(true);
        // save stream
        $.post(document.URL + '.json', ko.mapping.toJSON(this.carousels()), function (data, status, request) {
                // check for validation errors
                if (request.getResponseHeader('errors')) {
                    this.errors(data);
                    this.saving(false);
                } else {
                    // update carousels
                    this.carousels.removeAll();
                    ko.utils.arrayForEach(data, function(carousel) {
                        this.carousels.push(new carousel_model(carousel));
                    }.bind(this));
                }
            }.bind(this)).fail(function() {
                this.saving(false);
            }.bind(this));
    }.bind(this);

    // add carousel
    this.add_carousel = function() {
        this.carousels.push(new carousel_model());
    }.bind(this);

    // remove carousel
    this.remove_carousel = function(carousel) {
        this.carousels.remove(carousel);
    }.bind(this);

    // cancel
    this.cancel = function() {
        window.location = '/';
    };

    // initialize
    this.refresh();

};

function welcome_index_model() {

    // members
    this.recent_files = ko.observableArray();

    // refresh
    this.refresh = function() {

        // get recent files
        $.get('http://cloudcast.gdmradio.com/service/recent_files.json', function (recent_files) {
            if (!recent_files) return;
            ko.utils.arrayForEach(recent_files, function(recent_file) {
                this.recent_files.push(ko.mapping.fromJS(recent_file));
            }.bind(this));
        }.bind(this));

    };

    // initialize
    this.refresh();

};

///////////
// HOOKS //
///////////

// gdmradio
function hook_common() {

    // player
    ko.applyBindings(new gdmradio_player_model(), document.getElementById('gdmradio-player'));
    // login inputs
    $('#login-menu input').click(function() { event.stopPropagation(); });

}

// posts
function hook_posts() {

    // form
    var post_form_element = document.getElementById('post-form');
    if (post_form_element)
        ko.applyBindings(new post_form_model(), post_form_element);

    // view
    var post_view_element = document.getElementById('post-view');
    if (post_view_element)
        ko.applyBindings(new post_view_model(), post_view_element);

}

// shows
function hook_shows() {

    // index
    var shows_index_element = document.getElementById('shows-index');
    if (shows_index_element)
        ko.applyBindings(new shows_index_model(), shows_index_element);

}

// welcome
function hook_welcome() {

    // index
    var welcome_index_element = document.getElementById('welcome-index');
    if (welcome_index_element)
        ko.applyBindings(new welcome_index_model(), welcome_index_element);

    // form
    var welcome_form_element = document.getElementById('welcome-form');
    if (welcome_form_element)
        ko.applyBindings(new welcome_form_model(), welcome_form_element);

    // carousel
    $('.carousel').carousel({
        interval: 10000
    });

}

///////////
// READY //
///////////

$(function() {

    hook_welcome();
    hook_posts();
    hook_shows();
    hook_common();

});