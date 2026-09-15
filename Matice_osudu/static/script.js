const container = document.getElementById("recenze-container");

recenzeData.forEach(recenze => {
    const box = document.createElement("div");
    box.classList.add("box");

box.innerHTML = `
        <div class="box">
            <h1 class="review-name">${recenze.jmeno}</h1>
            <p class="review-text">"${recenze.text}"</p>
        </div>
    `;

    container.appendChild(box);
});