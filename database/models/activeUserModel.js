const mongoose = require("mongoose");
const { Types } = mongoose;

const sechemLogOut = new mongoose.Schema(
  {
    user: {
      type: Types.ObjectId,
      ref: "User",
      required: false,
      unique: true,
    },
    email: { type: String, required: false, unique: true },
    role: { type: String, required: false },
    exp: { type: String, required: false },
    timeLogin: { type: String, required: false },
    timeLogout: { type: String, required: false },
  },
  { timestamps: true }
);

// sechemLogOut.path("_id")    // create _id

// const doc = new Model();   // add new data in model and save
// await doc.save();

// Ids
// By default, Mongoose adds an _id property to your schemas.
//_id: false                 // disable the _id property on your subdocuments

// Statics
//  three ways to add function to model ||  There are three equivalent ways to add a static:
// Add a function property to the second argument of the schema-constructor (statics)
// const animalSchema = new Schema({ name: String, type: String },{
// statics:{
//   findByName(name){
//     return this.find({name :new RegExp(name,"i")})
//   }
// }
// })
// // Add a function property to schema.statics
// animalSchema.statics.findByName=function(name){
//   return  this.find({name :new RegExp(name,"i")})
// }
// const Animal = mongoose.model('Animal', animalSchema);
// const animal =await Animal.findByName("amr");

// sechemLogOut.statics.findByName = function (email) {
//   return this.find({ email: new RegExp(email, "i") });
// };

// async function findEmail() {
//   try {
//     const email = await ActiveUserModel.findByName("amr5189520@gmail.com");
//     console.log("findEmail  ", email);
//   } catch (err) {
//     console.error(err);
//   }
// }
// findEmail();
// Do not declare statics using ES6 arrow functions (=>)   not work because of the value of this

// Query Helpers
// You can also add query helper functions, which are like instance methods but for mongoose queries.
// query: {
//   byName(name) {
//     return this.where({ name: new RegExp(name, 'i') });
//   }
// }

// animalSchema.query.byName = function(name) {
//   return this.where({ name: new RegExp(name, 'i') });
// };
// const ActiveUserModel = mongoose.model("login", sechemLogOut);
// ActiveUserModel.find().byName("amr").exec((err,name)=>{
//   console.log(name)
// })

// productSchema.query.search = function (keyword) {
//   if (keyword) {
//     return this.find({ name: { $regex: keyword, $options: "i" } });
//   }
//   return this;
// };

// When your application starts up, Mongoose automatically calls createIndex for each defined index in your schema
// no create index automatic
// mongoose.connect('mongodb://user:pass@127.0.0.1:port/database', { autoIndex: false });
// mongoose.createConnection('mongodb://user:pass@127.0.0.1:port/database', { autoIndex: false });
// mongoose.set('autoIndex', false);
// animalSchema.set('autoIndex', false);
// new Schema({ /* ... */ }, { autoIndex: false });

// Virtuals العناصر الافتراضية
// في Mongoose، المقصود بـ Virtuals (الخصائص الافتراضية) هي خصائص غير مخزنة فعليًا في قاعدة البيانات، ولكن يتم حسابها أو توليدها عند استرجاع البيانات. بمعنى آخر، هي حقول لا يتم حفظها في قاعدة البيانات ولكن
//  يتم استخدامها لأغراض حسابية أو منطقية عند التعامل مع البيانات في الكود.
// userSchema.virtual('fullName')
//   .get(function() {
//     return `${this.firstName} ${this.lastName}`;
//   })
//   .set(function(v) {
//     const parts = v.split(' ');
//     this.firstName = parts[0];
//     this.lastName = parts[1];
//   });

// or

// personSchema.virtual('fullName').get(function() {
//   return this.name.first + ' ' + this.name.last;
// });

// تسهيل عمليات الحسابات أو العرض بدون الحاجة إلى تخزين البيانات الإضافية.
// القدرة على تقسيم البيانات أو دمجها بطريقة مريحة، مثل إنشاء خصائص مركبة من حقول أخرى.
// تحسين هيكلية البيانات بدون زيادة في حجم قاعدة البيانات.

// Aliases أسماء مستعارة
// في Mongoose، المقصود بـ Aliases (الأسماء المستعارة) هو إمكانية تعريف اسم آخر لحقل معين في الـ Schema.
//  يعني، تقدر تستخدم اسم مختصر أو مختلف عن اسم الحقل الأصلي عند استرجاع البيانات أو التعامل معها،
//  لكن في قاعدة البيانات نفسها يتم تخزين الاسم الأصلي.
// const personSchema = new Schema({
//   n: {
//     type: String,
//     // Now accessing `name` will get you the value of `n`, and setting `name` will set the value of `n`
//     alias: 'name'
//   }
// });

// Options
// option: autoIndex : true or false
// The autoIndex option is set to true by default. You can change this default by setting mongoose.set('autoIndex', false);

// option: autoCreate : true or false
// شرح: إذا تم تمكين هذا الخيار، سيقوم Mongoose بإنشاء مجموعة (collection) في قاعدة البيانات إذا لم تكن موجودة بالفعل.
// يمكنك تعيين autoCreate إلى true أثناء تعريف المخطط (schema) إذا كنت تريد من Mongoose إنشاء المجموعة تلقائيًا.

// option: bufferCommands
// عندما يكون bufferCommands true (وهذا هو السلوك الافتراضي)، سيقوم Mongoose بتخزين العمليات مؤقتاً (مثل .find() أو .save()) حتى يتم إنشاء الاتصال بقاعدة البيانات.
// عندما يكون bufferCommands false، لن يقوم Mongoose بتخزين العمليات. أي محاولة لتنفيذ استعلام أو عملية قبل أن يتم الاتصال بقاعدة البيانات ستؤدي إلى حدوث خطأ.
// إذا كان التطبيق يعتمد على قاعدة البيانات بشكل كبير:
// استخدام bufferCommands: true يكون الخيار الأفضل، لأن Mongoose سيقوم بتخزين العمليات مؤقتاً حتى يتم الاتصال بقاعدة البيانات
// إذا كان التطبيق يحتاج إلى استجابة فورية في حال فشل الاتصال بقاعدة البيانات:
// استخدام bufferCommands: false

// option: bufferTimeoutMS
// bufferCommands: كما تم التوضيح سابقاً، هو الخيار الذي يسمح لـ Mongoose بتخزين الأوامر (مثل عمليات الاستعلام أو التحديث) مؤقتاً إذا لم يتم الاتصال بقاعدة البيانات بعد.
// bufferTimeoutMS: يحدد المدة الزمنية التي يسمح فيها لـ Mongoose بالاستمرار في تخزين هذه الأوامر. إذا انقضت هذه المدة الزمنية ولم يتم الاتصال بقاعدة البيانات، سيتوقف Mongoose عن تخزين العمليات ويرمي خطأ.

// option: capped
// المجموعة المحدودة هي نوع خاص من المجموعات التي تحتفظ فقط بحجم معين من البيانات، وعندما يصل حجم البيانات في المجموعة إلى الحد الأقصى المحدد،
//  تقوم MongoDB بحذف الوثائق الأقدم لإفساح المجال للوثائق الأحدث.
// const schemaWithMaxDocs = new mongoose.Schema(
//   { name: String },
//   { capped: { size: 1024, max: 100 } }
// );

// option: collection
// تأثير عدم تحديد collection:
// إذا لم تقم بتحديد الخيار collection، فسيقوم Mongoose بإنشاء اسم مجموعة افتراضي بناءً على اسم النموذج (model).

// option: discriminatorKey
// تعريف المخطط الأساسي
// const animalSchema = new mongoose.Schema(
//   {
//     name: { type: String, required: true },
//     type: { type: String, required: true },
//   },
//   {
//     discriminatorKey: "kind", // تعيين مفتاح التمييز
//   }
// );
// const Animal = mongoose.model("Animal", animalSchema);

// const dogSchema = new mongoose.Schema({
//   barkVolume: { type: Number, required: true },
// });
// const dog = Animal.discriminator("Dog", dogSchema);

// const catSchema = new mongoose.Schema({
//   barkVolume: { type: Number, required: true },
// });
// const cat = Animal.discriminator("Cat", dogSchema);

// in controllers
// const dog = new Dog({ name: 'Rex', type: 'dog', barkVolume: 10 });
// const cat = new Cat({ name: 'Whiskers', type: 'cat', meowVolume: 5 });
// await dog.save();
// await cat.save();

// option: excludeIndexes
// يُستخدم لتحديد ما إذا كان يجب استبعاد الفهارس (indexes) عند إنشاء مجموعة جديدة
// (collection) في قاعدة البيانات. عند تعيين هذا الخيار إلى true، سيتم إنشاء المجموعة
//  دون فهارس، مما قد يكون مفيدًا في بعض الحالات حيث لا تحتاج إلى
//  الفهارس أو ترغب في تحسين وقت إنشاء المجموعة.
// يحدد ما إذا كان يجب إنشاء الفهارس على الحقول
// القيمه الافتراضيه false

// option: id
// تعيين id إلى false: إذا قمت بتعيين id: false، فلن يتم إضافة خاصية _id إلى الوثائق عند إنشائها
// مفيد في بعض الحالات، مثل عندما تستخدم مخططًا فرعيًا (subdocument) ولا تحتاج إلى معرّف فريد لكل وثيقة فرعية.
// يحدد ما إذا كان يجب إضافة خاصية _id إلى الوثائق
// القيمه الافتراضيه true
// استخدم id: false عندما لا تحتاج إلى معرف فريد لكل وثيقة، مثل في المستندات الفرعية.

// option: _id
// خيار _id في Mongoose يُستخدم للتحكم في خاصية _id التي تُضاف تلقائيًا إلى كل مستند عند إنشائه. هذه الخاصية تُعتبر معرفًا فريدًا
// (Unique Identifier) لكل مستند في مجموعة (collection).
// true: القيمة الافتراضية، مما يعني أن خاصية _id ستتم إضافتها تلقائيًا إلى كل مستند يتم إنشاؤه.
// false: إذا قمت بتعيين _id إلى false، فلن تتم إضافة خاصية _id إلى المستندات. يُمكن أن يكون

// الفرق بين _id وid
// _id: يُحدد ما إذا كانت خاصية _id يجب أن تُضاف أم لا.
// id: يُستخدم لتحديد ما إذا كان يجب توفير خاصية id (التي هي نسخة مريحة من _id) في نتائج الاستعلامات.
//  عندما تكون id true، سيتم إضافة خاصية id
// (التي تحتوي على القيمة نفسها مثل _id) في نتائج الاستعلام.

const ActiveUserModel = mongoose.model("login", sechemLogOut);
module.exports = ActiveUserModel;
