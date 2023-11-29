
/**
 * 
 * @param {HTMLElement} elementA Element to swap
 * @param {HTMLElement} elementB Element to swap
 * @param {number} duration Duration of the transition in miliseconds
 */
function smoothInlineElementSwap(elementA, elementB, duration) {
    const parentA = elementA.parentNode // The destination of element B
    const afterA = elementA.nextSibling // We need this to place element B in the exact place where A was.
    const strStyleA = elementA.getAttribute("style") // Easier for inline style backup
    const styleA = elementA.style // To apply the needed styling
    const {top: topA, left: leftA} = elementA.getBoundingClientRect() // Element A positioning on the viewport

    // The same comments above apply here
    const parentB = elementB.parentNode
    const afterB = elementB.nextSibling
    const strStyleB =elementB.getAttribute("style")
    const styleB = elementB.style
    const {top: topB, left: leftB} = elementB.getBoundingClientRect()

    styleA.transition = `transform ${duration}ms ease 0s` // Set the transition property
    styleA.display = `inline-block` // translate doesn't work on inline elements so we need to temporarily set it to inline-block
    styleA.position = `relative` // This puts the element in a new stacking context above the parents as long as they are not positioned
    styleA.zIndex = "1" // Related to the previous explanation
    styleB.transition = `transform ${duration}ms ease 0s`
    styleB.display = `inline-block`
    styleB.position = `relative`
    styleB.zIndex = "1"

    // Turning the transition into a promise
    // We leak the resolve function to the transitionResolver
    // So we can call it later. This way we can use it on
    // the callback to the transitionend event and invoke
    // it when both transitions are done.
    let transitionResolver
    let transitionCount = 0
    const transitionPromise = new Promise((resolve) => {transitionResolver = resolve})
    const transitionDone = () => {
        transitionCount++
        if (transitionCount >= 2) {
            parentA.removeChild(elementA)
            parentB.removeChild(elementB)
            parentA.insertBefore(elementB, afterA)
            parentB.insertBefore(elementA, afterB)
            elementA.ontransitionend = undefined
            elementB.ontransitionend = undefined
            elementA.style = strStyleA
            elementB.style = strStyleB
            transitionResolver()
        }
    }

    elementA.ontransitionend = transitionDone
    elementB.ontransitionend = transitionDone

    // Let the previous styles take effect in-case they didn't
    // Might not be needed but doesn't hurt to do it
    setTimeout(() => {
        styleA.transform = `translate(${leftB - leftA}px, ${topB - topA}px)`;
        styleB.transform = `translate(${leftA - leftB}px, ${topA - topB}px)`;
    }, 0)

    // Return the promise to the caller can wait for the swapping to be completed
    return transitionPromise
}

document.addEventListener("DOMContentLoaded", async () => {
    const elementA = document.querySelector(".elementA")
    const elementB = document.querySelector(".elementB")

    await smoothInlineElementSwap(elementA, elementB, 1000)
    console.log("done");
})