const server = require("../server");
const chai = require("chai");
const chaiHttp = require("chai-http");
chai.should();
chai.use(chaiHttp);
const { assert, expect } = chai;



it('Is an array', (done)=> {
  chai
    .request(server)
    .get("/reviews")
    .end((err,response)=>{
      expect(response.body.reviews).to.be.an('array')
      expect(response.body.reviews).to.not.be.empty;

      done();

    })
})

it('Correct properties', (done)=> {
  chai.request(server)
    .get("/reviews")
    .end((err,response)=>{
      expect(response.body).to.have.property('my_title');
      expect(response.body).to.have.property('reviews');
      expect(response.body).to.have.property('message');
      expect(response.body).to.have.property('error');
      done();
    })
})
