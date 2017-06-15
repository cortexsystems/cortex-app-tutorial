import View from './view.js';

function main() {
  window.addEventListener('cortex-ready', function() {
    window.Cortex.app.getConfig().then(function(config) {
      const duration = Number(config['cortex.tutorial.duration']);
      console.info('Application will be initialized.', {duration: duration});

      const view = new View(duration);
      window.Cortex.scheduler.onPrepare((offer) => view.prepare(offer));
    }).catch(function(err) {
      console.error('Failed to initialize the application: ', err);
      throw err;
    });
  });
}

module.exports = main();
