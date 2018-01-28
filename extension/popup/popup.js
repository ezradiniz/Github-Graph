
function onClickBtn() {
  chrome.runtime.sendMessage({ type: 'START' }, response => {
    // TODO: Handle response
    console.log(response);
  });
}

const btn = document.querySelector(".button");
btn.addEventListener("click", onClickBtn);
