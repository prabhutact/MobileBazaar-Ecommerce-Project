const moment = require('moment');

function incHelper(Handlebars) {

  Handlebars.registerHelper('inc', function (value,value2) {
      return value -value2;
  });
}

function incrementHelper (Handlebars) {
  Handlebars.registerHelper('increment', function(index) {
    return index + 1;
  });
}

function mulHelper(Handlebars) {

  Handlebars.registerHelper('multiply', function (value1, value2) {
      return value1 * value2;
  });
}

function addHelper(Handlebars) {

  Handlebars.registerHelper('add', function (value1, value2) {
      return value1 + value2;
  });
}


function isequal(Handlebars) {
  Handlebars.registerHelper('ifEquals', function (arg1, arg2, options) {
      //console.log(arg1,arg2,options)
      return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
  });
}

function isCancelled(Handlebars) {
  Handlebars.registerHelper('statuchecker',  function (value) {
      let ct=0
      let ct2=0
      let returnct= value.product.forEach((elem)=>{
          if(elem.isReturned)ct++
      })
      let returnct2= value.product.forEach((elem)=>{
          if(elem.isCancelled)ct2++
      })

      let allCancelled = value.product.every(product => product.isCancelled);
      let allReturned = value.product.every(product => product.isReturned);
      // if(ct>0 && value.status!=="Returned"){
      //    let change=   Order.findByIdAndUpdate(value._id, { $set: { status: 'Returned' } }, { new: true });
      // }
  
      if (value.status === "Delivered") {
          return new Handlebars.SafeString(`
              <button id="returnOrder" data-order-id="${value._id}" class="btn btn-sm btn-primary">Return Entire Order</button>
          `);
      } else if (value.status == "Returned") {
          return new Handlebars.SafeString('<span class="badge rounded-pill alert-info text-info">Order Returned</span>');
      } else {
          if (allCancelled || value.status === 'Cancelled') {
              return new Handlebars.SafeString('<span class="badge rounded-pill alert-danger text-danger">Order Cancelled</span>');
          } else if (ct>0 ) {
              return new Handlebars.SafeString('<span class="badge rounded-pill alert-info text-info">Order Returned</span>');
          } else {
              return new Handlebars.SafeString(`
                  <button id="cancelOrder" data-order-id="${value._id}" class="btn btn-sm btn-primary">Cancel Entire Order</button>
              `);
          }
      }
  });
}


function formatDate(Handlebars) {

  Handlebars.registerHelper('formatDate', function (isoDate) {
      const monthYear = moment(isoDate).format('DD-MM-YYYY HH:mm:ss');

  
      return `${monthYear}`;
  });
}



module.exports = {
  incHelper,
  incrementHelper,
  mulHelper,
  addHelper,
  isCancelled,
  formatDate,
  isequal
}