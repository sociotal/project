var debug = require('debug')('models:user');

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var crypto = require('crypto');
var oAuthTypes = ['facebook'];

var DeviceSchema = mongoose.Schema({
    name: {type : String, default: ''},
    registration_id: {type : String, default: ''},
});

var CommunitySchema = mongoose.Schema({
    community_id: {type : String},
    name: {type : String},
    token: {type : String},
    domain_name: {type : String}
});

/**
 * User Schema
 */

var UserSchema = new Schema({
  name: { type: String, default: '' },
  email: { type: String, default: '' },
  username: { type: String, default: '' },
  idm_id: {type: String, default: ''},
  idm_token: {type: String, default: ''},
  provider: { type: String, default: '' },
  //hashed_password: { type: String, default: '' },
  image: {type: String, default: ''},
  //salt: { type: String, default: '' },
  authToken: { type: String, default: '' },
  online: {type: Boolean, default: false},
  devices: [DeviceSchema],
  //communities: [CommunitySchema],
  android_registration_id: { type: String, default: '' }, // this id is used to send push notifiaction to the user smartphone
  facebook: {},
  activationToken: { type: String, default: '' },
  active: {type: Boolean, default: false}
});

/**
 * Virtuals
 */
//
//UserSchema
//  //.virtual('password')
//  //.set(function(password) {
//  //  this._password = password;
//  //  this.salt = this.makeSalt();
//  //  this.hashed_password = this.encryptPassword(password);
//  //})
//  //.get(function() { return this._password; });
//  .get(function() {return this.username; });

/**
 * Validations
 */

var validatePresenceOf = function (value) {
  return value && value.length;
};

// the below 5 validations only apply if you are signing up traditionally

UserSchema.path('name').validate(function (name) {
  if (this.doesNotRequireValidation()) return true;
  return name.length;
}, 'Name cannot be blank');

UserSchema.path('email').validate(function (email) {
  if (this.doesNotRequireValidation()) return true;
  return email.length;
}, 'Email cannot be blank');

UserSchema.path('username').validate(function (username, fn) {
  var User = mongoose.model('User');
  if (this.doesNotRequireValidation()) fn(true);

  // Check only when it is a new user or when email field is modified
  if (this.isNew || this.isModified('username')) {
    User.find({ username: username }).exec(function (err, users) {
      fn(!err && users.length === 0);
    });
  } else fn(true);
}, 'Username already exists.');


UserSchema.path('username').validate(function (username) {
  if (this.doesNotRequireValidation()) return true;
  return username.length;
}, 'Username cannot be blank');

//UserSchema.path('hashed_password').validate(function (hashed_password) {
//  if (this.doesNotRequireValidation()) return true;
//  return hashed_password.length;
//}, 'Password cannot be blank');


/**
 * Pre-save hook
 */

UserSchema.pre('save', function(next) {
  if (!this.isNew)
    return next();

  //if (!validatePresenceOf(this.password) && !this.doesNotRequireValidation())
  //  next(new Error('Invalid password'));
  else
    next();
});

/**
 * Methods
 */

UserSchema.methods = {


  /**
   * Authenticate - check if the passwords are the same
   *
   * @param {String} plainText
   * @return {Boolean}
   * @api public
   */

  authenticate: function (plainText) {
    return this.encryptPassword(plainText) === this.hashed_password;

  },

  /**
   * Make salt
   *
   * @return {String}
   * @api public
   */

  makeSalt: function () {
    return Math.round((new Date().valueOf() * Math.random())) + '';
  },

  /**
   * Encrypt password
   *
   * @param {String} password
   * @return {String}
   * @api public
   */

  encryptPassword: function (password) {
    if (!password) return '';
    var encrypred;
    try {
      encrypred = crypto.createHmac('sha1', this.salt).update(password).digest('hex');
      return encrypred;
    } catch (err) {
      return '';
    }
  },

  /**
   * Validation is not required if using OAuth
   */

  doesNotRequireValidation: function() {
    return ~oAuthTypes.indexOf(this.provider);
  }
};

mongoose.model('User', UserSchema);
