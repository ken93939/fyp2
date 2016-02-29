module.exports = function(EmailTemplate) {

EmailTemplate.getEmailTemplate=function(cb){
	EmailTemplate.findById(1,{},function(err,emailInstance){
		if(err){
			console.log(err);
			cb(err,null);
		}
		else{
			cb(null,emailInstance.text);
		}
	});
}

EmailTemplate.updateEmailTemplate=function(text,cb){
	EmailTemplate.findById(1,{},function(err,emailInstance){
		if(err){
			console.log(err);
			cb(err,null);
		}
		else{
			emailInstance.updateAttribute("text", text, function(err,ins){
				if(err){
					console.log(err);
					cb(err,null);
				}
				else{
					console.log(ins);
					cb(null,ins);
				}
			});
		}
	})
}

};
