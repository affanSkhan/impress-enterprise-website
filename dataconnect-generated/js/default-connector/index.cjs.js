const { getDataConnect, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'default',
  service: 'Empire_spare_parts',
  location: 'us-central1'
};
exports.connectorConfig = connectorConfig;

