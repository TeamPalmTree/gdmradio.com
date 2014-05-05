// carousel model
function Carousel_Model(carousel) {

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

// gdmradio nav model
function GDMRadio_Navigation_Model() {

    // self
    var self = this;
    // inherit
    Navigation_Model.call(this);
    // members
    this.status = ko.observable();
    this.buffering = ko.observable(false);
    this.playing = ko.observable(false);
    // create audio
    this.audio = new Audio();
    this.buffer_seconds = 5000;

    // css
    this.css = ko.computed(function() {
        if (self.buffering())
            return 'glyphicon-transfer';
        else if (!self.playing())
            return 'glyphicon-play';
        else
            return 'glyphicon-stop';
    });

    // refresh
    this.refresh = function() {
        $.ajax({
            url: 'http://cloudcast.gdmradio.com/service/status.json',
            dataType: "json",
            crossDomain: true,
            success: function (status_js) {
                if (!self.status())
                    self.status(new Status_Model(status_js));
                else
                    self.status().update(status_js);
            }
        });
    };

    // listen
    this.listen = function() {
        window.location = "#gdmradio-listen"
        $('#gdmradio-listen').effect('pulsate');
    };

    // load
    this.buffer = function(play) {

        // set source
        self.audio.src = 'http://icecast.gdmradio.com:8000/128.mp3';
        // load source
        self.audio.load();
        // set buffering
        self.buffering(true);
        // set audio available after a small time
        setTimeout(function() {
            // done buffering
            self.buffering(false);
            // auto-play
            if (play) {
                // play audio (will fire playing above)
                self.audio.play();
            }
        }, self.buffer_seconds);

    };

    // stop
    this.stop = function() {
        // set source empty
        self.audio.pause();
        self.audio.src = "";
        // set not playing and not buffering
        self.playing(false);
        self.buffering(false);
    };

    // play
    this.play = function() {
        // make sure we are not buffering
        if (self.buffering())
            return;
        // if not playing, buffer
        if (!self.playing())
            self.buffer(true);
        else
            self.stop();
    };

    // initialize
    this.initialize = function() {

        // call base
        Navigation_Model.prototype.initialize.call(self);
        // add event listener for playing
        self.audio.addEventListener('play', function() {
            self.playing(true);
        });

        // buffer & play
        self.buffer(true);
        // poll engine for status
        setInterval(function() {
            self.refresh();
        }, 5000);
        // initial poll
        self.refresh();

    };

};

// gdmradio nav model prototype
GDMRadio_Navigation_Model.prototype = Object.create(Navigation_Model.prototype);
GDMRadio_Navigation_Model.prototype.constructor = GDMRadio_Navigation_Model;

// post comment
function Post_Comment_Model(post_comment) {

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
function Posts_Form_Model() {

    // self
    var self = this;
    // inherit
    Component_Model.call(this);
    // members
    this.post = ko.observable();
    this.saving = ko.observable(false);
    this.errors = ko.observable();

    // refresh
    this.refresh = function() {
        // get post from url
        $.post(document.URL + '.json', function (post) {
            if (!post) return;
            self.post(new Post_Model(post));
        });
    };

    // save
    this.save = function() {
        // verify not already saving
        if (self.saving()) return;
        // set saving
        self.saving(true);
        // save stream
        $.post(document.URL + '.json', ko.mapping.toJSON(self.post()), function (data, status, request) {
                // check for validation errors
                if (request.getResponseHeader('errors')) {
                    self.errors(data);
                    self.saving(false);
                } else {
                    // redirect to shows
                    window.location = '/posts';
                }
            }).fail(function() {
                self.saving(false);
            });
    };

    // cancel
    this.cancel = function() {
        window.location = '/posts';
    };

};

// posts form model prototype
Posts_Form_Model.prototype = Object.create(Component_Model.prototype);
Posts_Form_Model.prototype.constructor = Posts_Form_Model;

// post
function Post_Model(post) {

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
function Posts_View_Model() {

    // self
    var self = this;
    // inherit
    Component_Model.call(this);
    // members
    this.post = ko.observable();
    this.post_comment = ko.observable(new Post_Comment_Model());
    this.commenting = ko.observable(false);
    this.errors = ko.observable();

    // refresh
    this.refresh = function() {
        // get stream from url
        $.post(document.URL + '.json', function (post) {
            if (!post) return;
            self.post(new Post_Model(post));
        });
    };

    // save
    this.comment = function() {
        // verify not already commenting
        if (self.commenting()) return;
        // set commenting
        self.commenting(true);
        // save post comment
        $.post('/posts/comment/' + self.post().id() + '.json', ko.mapping.toJSON(self.post_comment()), function (data, status, request) {
            // check for validation errors
            if (request.getResponseHeader('errors')) {
                self.errors(data);
            } else {
                // add to post comments
                self.post().post_comments.unshift(new Post_Comment_Model(data));
                // clear editor
                self.post_comment().comment('');
            }
            // set not commenting
            self.commenting(false);
        }).fail(function() {
            self.commenting(false);
        });
    };

};

// posts view model prototype
Posts_View_Model.prototype = Object.create(Component_Model.prototype);
Posts_View_Model.prototype.constructor = Posts_View_Model;

// show day
function Show_Day_Model(show_day) {
    ko.mapping.fromJS(show_day, {
        'shows': {
            create: function(options) {
                var show = new Show_Model(options.data);
                show.show_full_date(false);
                return show;
            }
        }
    }, this);
};

// shows index model
function Shows_Index_Model() {

    // self
    var self = this;
    // inherit
    Component_Model.call(this);
    // members
    this.single_shows = ko.observableArray();
    this.repeat_days = ko.observableArray();

    // refresh
    this.refresh = function() {

        // clear out arrays
        self.single_shows.removeAll();
        self.repeat_days.removeAll();
        // get single shows
        $.get('http://cloudcast.gdmradio.com/service/single_shows.json', function (singles_shows) {
            if (!singles_shows) return;
            ko.utils.arrayForEach(singles_shows, function(singles_show) {
                self.single_shows.push(new Show_Model(singles_show));
            }.bind(this));
        }.bind(this));
        // get repeat shows days
        $.get('http://cloudcast.gdmradio.com/service/show_repeat_days.json', function (repeat_days) {
            if (!repeat_days) return;
            ko.utils.arrayForEach(repeat_days, function(repeat_day) {
                self.repeat_days.push(new Show_Day_Model(repeat_day));
            });
        });

    };

    // scroll to a day
    this.scroll_to_day = function(repeat_day) {
        $('html, body').animate({
            scrollTop: $('#' + repeat_day.day()).offset().top - 50
        }, 1000);
    }

};

// posts view model prototype
Shows_Index_Model.prototype = Object.create(Component_Model.prototype);
Shows_Index_Model.prototype.constructor = Shows_Index_Model;

// show
function Show_Model(show) {
    this.show_full_date = ko.observable(true);
    ko.mapping.fromJS(show, {}, this);
};

///////////////////
// STATUS MODELS //
///////////////////

// status
function Status_Model(status) {

    // self
    var self = this;
    // standard members
    this.current_file_artist = ko.observable();
    this.current_file_title = ko.observable();
    // max string length
    this.max_string_length = 20;

    // update
    this.update = function(status) {
        // truncate artist
        if (status.current_file_artist.length > self.max_string_length)
            status.current_file_artist = status.current_file_artist.substring(0, self.max_string_length) + '...';
        // truncate artist
        if (status.current_file_title.length > self.max_string_length)
            status.current_file_title = status.current_file_title.substring(0, self.max_string_length) + '...';
        // mapping
        ko.mapping.fromJS(status, null, self);
    };

    // initialize
    this.update(status);

};

function Welcome_Form_Model() {

    // self
    var self = this;
    // inherit
    Component_Model.call(this);
    // members
    this.carousels = ko.observableArray();
    this.saving = ko.observable(false);
    this.errors = ko.observable();

    // refresh
    this.refresh = function() {
        // get post from url
        $.post(document.URL + '.json', function (carousels) {
            if (!carousels) return;
            self.carousels.removeAll();
            ko.utils.arrayForEach(carousels, function(carousel) {
                self.carousels.push(new Carousel_Model(carousel));
            });
        });
    };

    // save
    this.save = function() {
        // verify not already saving
        if (self.saving()) return;
        // set saving
        self.saving(true);
        // save stream
        $.post(document.URL + '.json', ko.mapping.toJSON(this.carousels()), function (data, status, request) {
                // check for validation errors
                if (request.getResponseHeader('errors')) {
                    self.errors(data);
                    self.saving(false);
                } else {
                    // update carousels
                    self.carousels.removeAll();
                    ko.utils.arrayForEach(data, function(carousel) {
                        self.carousels.push(new Carousel_Model(carousel));
                    });
                }
            }).fail(function() {
                self.saving(false);
            });
    };

    // add carousel
    this.add_carousel = function() {
        self.carousels.push(new Carousel_Model());
    };

    // remove carousel
    this.remove_carousel = function(carousel) {
        self.carousels.remove(carousel);
    };

    // cancel
    this.cancel = function() {
        window.location = '/';
    };

};

// welcome form model prototype
Welcome_Form_Model.prototype = Object.create(Component_Model.prototype);
Welcome_Form_Model.prototype.constructor = Welcome_Form_Model;

// welcome index model
function Welcome_Index_Model() {

    // self
    var self = this;
    // inherit component model
    Component_Model.call(this);
    // members
    this.recent_files = ko.observableArray();

    // refresh
    this.refresh = function() {

        // get recent files
        $.get('http://cloudcast.gdmradio.com/service/recent_files.json', function (recent_files) {
            if (!recent_files) return;
            self.recent_files.removeAll();
            ko.utils.arrayForEach(recent_files, function(recent_file) {
                self.recent_files.push(ko.mapping.fromJS(recent_file));
            });
        });

    };



};

// welcome index model prototype
Welcome_Index_Model.prototype = Object.create(Component_Model.prototype);
Welcome_Index_Model.prototype.constructor = Welcome_Index_Model;

///////////
// READY //
///////////

$(function() {

    // login inputs
    $('#login-menu input').click(function() { event.stopPropagation(); });

});