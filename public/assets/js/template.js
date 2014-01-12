/////////////////////
// GDMRADIO MODELS //
/////////////////////

// gdmradio playing
var gdmradio_playing_model = function () {

    // members
    this.status = ko.observable();

    // poll
    this.poll = function() {
        $.ajax({
            url: 'http://cloudcast.gdmradio.com/engine/status.json',
            dataType: "json",
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
    ko.applyBindings(new gdmradio_playing_model(), document.getElementById('gdmradio-playing'));

    /*// hook perceive
    $('#gdmradio-listen-perceive').click(function() {
        window.open('http://perceive.gdmradio.com','_blank','width=700,height=250,toolbar=no,location=no,status=no,scrollbars=no,menubar=no', true)
    });*/

    // carousel
    $('.carousel').carousel({
        interval: 5000
    });

}

// welcome
function hook_welcome() {

    // carousel
    $('.carousel').carousel({
        interval: 5000
    });

}

///////////
// READY //
///////////

$(function() {
    //hook_gdmradio();
    //hook_welcome();

    $('#login-menu input').click(function() { event.stopPropagation(); });

});