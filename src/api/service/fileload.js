const rp = require('request-promise');
const FormData = require('form-data');
const fs = require('fs');

module.exports = class extends think.Service {
  async uploadFile(path, name) {
    const sendOptions = {
      method: 'POST',
      url: think.config('fileserver.uploadurl'),
      formData: {
        file: {
          value: fs.createReadStream(path),
          options: {
            filename: name,
            contentType: 'image/jpg'
          }
        }
      }
    };
    try {
      const requestResult = await rp(sendOptions);
      if (think.isEmpty(requestResult)) {
        return 'fileserver error1';
      }
      return requestResult;
    } catch (err) {
      return 'fileserver error0';
    }
  }
};
