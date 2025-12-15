/** Sets up a precise digital clock. */
function preciseClock() {
    const now = new Date();
    const ms = now.getMilliseconds();

    // Calculate time until the next second mark
    const delay = 1000 - ms;

    // Update the display
    let hours = now.getHours();
    let minutes = now.getMinutes();
    let seconds = now.getSeconds();

    hours = hours < 10 ? "0" + hours : hours;
    minutes = minutes < 10 ? "0" + minutes : minutes;
    seconds = seconds < 10 ? "0" + seconds : seconds;

    document.getElementById("clock").textContent =
        `${hours}:${minutes}:${seconds}`;

    // Schedule the next update
    setTimeout(preciseClock, delay);
}

export { preciseClock };
