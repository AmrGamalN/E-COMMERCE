// class error extends Error {
//   constructor() {
//     super();
//   }
//   create(status, statusCode, statusText, message, data) {
//     this.status = status;
//     this.statusCode = statusCode;
//     this.statusText = statusText;
//     this.message = message;
//     this.data = data;
//     return this;
//   }
// }
// const userError = new error();
// module.exports = error;

class error extends Error {
  constructor(status, statusCode, statusText, message, data) {
    super(message);
    this.status = status;
    this.statusCode = statusCode;
    this.statusText = statusText;
    this.data = data;
  }
  static create(status, statusCode, statusText, message, data) {
    return new error(status, statusCode, statusText, message, data);
  }
}
module.exports = error;
