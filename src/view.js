const IMAGES = [
  './images/1.jpeg',
  './images/2.jpeg',
  './images/3.jpeg',
];

class View {
  constructor(duration) {
    this.duration = duration;
    this.index = 0;
  }

  prepare(offer, container) {
    if (this.index >= IMAGES.length) {
      this.index = 0;
    }

    const url = IMAGES[this.index];
    this.index += 1;

    this.createDOMNode(url).then((node) => {
      const view = (done, begin) => {
        container.appendChild(node);
        begin();
        window.setTimeout(done, this.duration);
      };

      offer(view, {label: url, ttl: 60 * 60 * 1000});
    }).catch((e) => {
      console.error('Failed to create a DOM node.', {url: url, error: e});
      offer();
    });
  }

  createDOMNode(url) {
    return new Promise((resolve, reject) => {
      const node = window.document.createElement('img');
      node.id = url;
      node.src = url;
      node.onload = () => {
        resolve(node);
      };
      node.onerror = reject;
    });
  }
}

module.exports = View;
