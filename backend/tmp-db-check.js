const mongoose=require('mongoose'); 
async function run(){ 
  await mongoose.connect('mongodb://localhost:27017/petec_v1'); 
  const db=mongoose.connection.db; 
  const cols=['feces_types','urine_types','medicine_categories','medicines']; 
  for(const c of cols){ 
    const count=await db.collection(c).countDocuments({isDeleted:{$ne:true}}); 
    console.log(c,count); 
    const docs=await db.collection(c).find({isDeleted:{$ne:true}}).project({_id:1,name:1,serialId:1,categoryId:1}).limit(5).toArray(); 
    console.log(JSON.stringify(docs)); 
  } 
  await mongoose.disconnect(); 
} 
run().catch(function(err){console.error(err);process.exit(1);}); 
