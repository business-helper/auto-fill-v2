docReady(function () {
    initModal();
    document.querySelector('.modal .modal-cancel').addEventListener('click', function() {
        dismissModal();
    })
    document.querySelector('.modal .modal-ok').addEventListener('click', function() {
        dismissModal();
    })
    document.querySelector('.modal ~ .overlay').addEventListener('click', function() {
        dismissModal();
    })
})

function dismissModal() {
    document.querySelector('.modal').style.display = 'none';
    document.querySelector('.modal ~ .overlay').style.display = 'none';
}

function showModal() {
    document.querySelector('.modal').style.display = 'block';
    document.querySelector('.modal ~ .overlay').style.display = 'block';
}

function initModal() {
    dismissModal();
}