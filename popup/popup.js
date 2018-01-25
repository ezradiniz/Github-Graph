
function onClickBtn() {
  console.log("ping");
  chrome.runtime.sendMessage({ type: 'START' }, response => {
    console.log(response);
  });
}

const btn = document.querySelector(".btn");
console.log(btn);
btn.addEventListener("click", onClickBtn);
