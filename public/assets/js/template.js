///////////
// HOOKS //
///////////

// welcome
function hook_welcome() {

    $('.carousel').carousel({
        interval: 5000
    })

}

///////////
// READY //
///////////

$(function() {
    hook_welcome();
});