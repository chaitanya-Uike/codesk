function qs(selector, parent = document) {
    return parent.querySelector(selector)
}

function qsa(selector, parent = document) {
    return [...parent.querySelectorAll(selector)]
}

export { qs, qsa }