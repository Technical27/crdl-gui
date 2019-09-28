const {ipcRenderer} = require('electron');
const $ = require('jquery');

ipcRenderer.on('update', (event, type, instance, status) => {
  if (!$(`#${type}${instance}`).length) $('#log').append($(`<span id=${type}${instance}></span>`));
  $(`#${type}${instance}`).html(`${type} instance ${instance}: ${status}`);
});

ipcRenderer.on('end', (event, type, instance) => $(`#${type}${instance}`).remove());

$(document).ready(() => {
  $('#addLink').click(() => {
    const $link = $('#newLink');
    console.log('starting');
    ipcRenderer.send('start', 'crdl', $link.val());
    $link.val('');
  });
});
