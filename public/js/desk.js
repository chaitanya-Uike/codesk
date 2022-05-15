const snapLayout = new SnapLayout('.wrapper', {
    onSetActive: taskbarStatusSet
})

function taskbarStatusSet(activeWindow, id) {
    // id of the 
    if (activeWindow)
        document.querySelector(`#${activeWindow.id}-icon`).querySelector(".status").classList.remove("active-icon")

    document.querySelector(`#${id}-icon`).querySelector(".status").classList.add("active-icon")
}