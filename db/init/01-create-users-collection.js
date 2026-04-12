db = db.getSiblingDB('strongernotes');

db.createCollection('users', {
  capped: false,
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      title: 'User',
      required: ['name', 'email', 'passwordHash', 'createdAt', 'updatedAt'],
      properties: {
        _id: {
          bsonType: 'objectId',
        },
        name: {
          bsonType: 'string',
        },
        email: {
          bsonType: 'string',
          description: 'User e-mail address',
        },
        passwordHash: {
          bsonType: 'string',
        },
        createdAt: {
          bsonType: 'date',
        },
        updatedAt: {
          bsonType: 'date',
        },
        __v: {
          bsonType: 'int',
        },
      },
      additionalProperties: false,
    },
  },
  validationLevel: 'strict',
  validationAction: 'warn',
});

db.users.createIndex({ email: 1 }, { unique: true, name: 'unique_email' });
