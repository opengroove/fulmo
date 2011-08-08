window.addEventListener('load', function(){
    if (document.getElementById('screenshot-sender-account-name')) {
        document.getElementById('screenshot-sender-account-name').value = window.arguments[0].account.name;
    }
    document.getElementById('screenshot-sender-account-user-id').value = window.arguments[0].account.userId;
    document.getElementById('screenshot-sender-account-password').value = window.arguments[0].account.password;
    if (window.arguments[0].account.userId.length) {
        document.getElementById('screenshot-sender-account-user-id').disabled = true;
    }
    if (window.arguments[0].account.password.length) {
        document.getElementById('screenshot-sender-account-password').disabled = true;
    }
}, false);

function onOk() {
    window.arguments[0].account.userId = document.getElementById('screenshot-sender-account-user-id').value;
    window.arguments[0].account.password = document.getElementById('screenshot-sender-account-password').value;
    window.arguments[0].goLogin = true;
}
