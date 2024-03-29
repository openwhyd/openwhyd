// inspired by http://html5demos.com/dnd-upload#view-source

window.DndUpload = function (options) {
  options = options || {};

  const handler =
    options.handler ||
    function (eventName, eventData) {
      if (options[eventName]) options[eventName](eventData, this);
      else console.log('DndHandler', eventName, eventData);
    };

  if (
    !(
      'draggable' in document.createElement('span') &&
      !!window.FormData &&
      'upload' in new XMLHttpRequest()
    )
  )
    return handler(
      'error',
      'drag&drop, formdata and upload progress are not supported',
    );

  if (!options.url) return handler('error', 'missing url parameter');

  if (!options.holder) return handler('error', 'missing holder parameter');

  const url = options.url;
  const holder = options.holder;

  holder.ondragover = function () {
    //this.className += ' hover';
    return false;
  };
  holder.ondragend = function () {
    //this.className = this.className.replace('hover', '');
    return false;
  };
  holder.ondrop = function (e) {
    //this.className = this.className.replace(' hover', '');
    e.preventDefault();
    const files = e.dataTransfer.files;
    const formData = new FormData();
    const formFields = (options.form || {}).elements;
    if (formFields)
      for (let i = formFields.length - 1; i >= 0; --i)
        if (formFields[i].type != 'file')
          formData.append(formFields[i].name, formFields[i].value);
    formData.append('file', files[0]);
    handler('post', files[0]);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.onload = function (e2) {
      handler('progress', 1);
      handler('complete', e2.target.response);
    };
    xhr.upload.onprogress = function (event) {
      if (event.lengthComputable) {
        //var complete = ( * 100 | 0);
        handler('progress', event.loaded / event.total);
      }
    };
    xhr.send(formData);
  };
};
