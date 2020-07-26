{
  window.addEventListener('submit', () => {
    // サブミットされてすぐには更新されないので、1s待つ
    setTimeout(() => {
      console.log('UPDATE_BY_SELF:');
    }, 1000);
  }, true);
}
