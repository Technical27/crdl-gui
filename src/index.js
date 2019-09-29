const {ipcRenderer} = require('electron');
const $ = require('jquery');
let instances = 0;
const que = [];

ipcRenderer.on('update', (event, type, instance, status) => {
  if (!$(`#${type}${instance}`).length) $('#log').append($(`<span id=${type}${instance}></span>`));
  $(`#${type}${instance}`).html(`${type} instance ${instance}: ${status}`);
});

ipcRenderer.on('end', (event, type, instance) => {
  if (que.length) {
    const args = que.shift();
    ipcRenderer.send('start', 'crdl', args[0], args[1]);
    $('#queLength').html(que.length);
  }
  else instances--;
  $(`#${type}${instance}`).remove();
});

$(document).ready(() => {
  $('#addLink').click(() => {
    const $link = $('#newLink');
    console.log('starting');
    if (instances < 2) {
      instances++;
      ipcRenderer.send('start', 'crdl', $link.val(), $('#subtitle').prop('checked'));
    }
    else {
      que.push([$link.val(), $('#subtitle').prop('checked')]);
      $('#queLength').html(que.length);
    }
    $link.val('');
  });
});
