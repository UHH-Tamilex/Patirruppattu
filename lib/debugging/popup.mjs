const showPopup = id => {
    const blackout = document.getElementById('blackout');
    blackout.style.display = 'flex';
    const popup = document.getElementById(id);
    popup.style.display = 'flex';
    return popup;
};

const cancelPopup = e => {
    const blackout = document.getElementById('blackout');
    blackout.style.display = 'none';

    for(const popup of blackout.querySelectorAll('.popup'))
        popup.style.display = 'none';

};

export { cancelPopup, showPopup };
