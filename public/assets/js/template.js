/////////////////////
// GDMRADIO MODELS //
/////////////////////

// gdmradio playing
var gdmradio_playing_model = function () {

    // members
    this.status = ko.observable();

    // poll
    this.poll = function() {
        $.get('http://cloudcast.gdmradio.com/engine/status.json', null, function (status_js) {
            if (!this.status())
                this.status(new status_model(status_js));
            else
                this.status().update(status_js);
        }.bind(this));
    }.bind(this);

    // poll engine for status
    setInterval(function() {
        this.poll();
    }.bind(this), 5000);
    // initial poll
    this.poll();

};

///////////////////
// STATUS MODELS //
///////////////////

// status
var status_model = function (status_js) {

    // standard members
    this.current_file_artist = ko.observable();
    this.current_file_title = ko.observable();
    this.current_file_duration = ko.observable();
    this.current_file_post = ko.observable();
    this.next_file_artist = ko.observable();
    this.next_file_title = ko.observable();
    this.current_show_title = ko.observable();
    this.current_show_duration = ko.observable();
    this.next_show_title = ko.observable();
    this.current_client_schedule_start_on = ko.observable();
    this.current_client_schedule_file_played_on = ko.observable();
    this.host_username = ko.observable();
    this.client_generated_on = ko.observable();
    // additional members
    this.current_file_percentage = ko.observable();
    this.current_show_percentage = ko.observable();
    this.current_file_post_percentage = ko.observable();
    this.current_file_elapsed = ko.observable();
    this.current_file_remaining = ko.observable();
    this.current_show_elapsed = ko.observable();
    this.current_show_remaining = ko.observable();
    this.updated_on_time = ko.observable();
    // input statuses
    this.schedule_input_active = ko.observable();
    this.show_input_active = ko.observable();
    this.talkover_input_active = ko.observable();
    this.master_input_active = ko.observable();
    // input enableds
    this.schedule_input_enabled = ko.observable();
    this.show_input_enabled = ko.observable();
    this.talkover_input_enabled = ko.observable();
    this.master_input_enabled = ko.observable();
    // input usernames
    this.show_input_username = ko.observable();
    this.talkover_input_username = ko.observable();
    this.master_input_username = ko.observable();

    // update
    this.update = function(status_js) {
        ko.mapping.fromJS(status_js, null, this);
    }.bind(this);

    // initialize
    this.update(status_js);

};

///////////
// HOOKS //
///////////

// gdmradio
function hook_gdmradio() {

    // playing
    //ko.applyBindings(new gdmradio_playing_model(), document.getElementById('gdmradio-playing'));

    // listen
    $('#gdmradio-playing-listen').click(function() {
        window.location = "#gdmradio-listen"
        $('#gdmradio-listen').effect('pulsate');
    });

    // carousel
    $('.carousel').carousel({
        interval: 5000
    })

}

// welcome
function hook_welcome() {

    // carousel
    $('.carousel').carousel({
        interval: 5000
    })

}

///////////
// READY //
///////////

$(function() {
    hook_gdmradio();
    hook_welcome();
});