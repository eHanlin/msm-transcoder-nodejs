var JSON = require("JSON");

(function(){
  var encodeNum = function(num, data, maxBytes){
    var result = num.toString(16);
    var zeroNum = (maxBytes*2) - result.length;
    for(var i=0 ; i<zeroNum ; i++){
      result = "0"+result;
    }
    for(var i=0 ; i<result.length ; i+=2){
      data.push(parseInt(result.substr(i, 2), 16));
    }
  };

  var decodeNum = function(data, beginIndex, numBytes){
    var result = "";
    for(var i=0 ; i<numBytes ; i++){
      var numStr = data[beginIndex + i].toString(16);
      if(numStr.length == 1){
        numStr = "0"+numStr;
      }
      result += numStr;
    }
    return parseInt(result, 16);
  };

  var encodeBoolean = function(value, data){
    if(value){
      data.push(49);
    }else{
      data.push(48);
    }
  };

  var decodeBoolean = function(data, index){
    return data[index] == 49;
  };

  var encodeString = function(str){
    var buf = new Buffer(str, "UTF-8");
    var data = Array.prototype.slice.call(buf, 0);
    return {length : data.length, data : data};
  };

  var decodeString = function(data, beginIndex, length){
    var buf = new Buffer(length);
    data.copy(buf, 0, beginIndex, beginIndex+length);
    return buf.toString("UTF-8");
  };

  var pushAll = function(arr1, arr2){
    for(var i=0 ; i<arr2.length ; i++){
      arr1.push(arr2[i]);
    }
  };


  var serialize = function(sessionObj){
    var bytes = [];
    encodeNum(sessionObj.version, bytes, 2);
    encodeNum(sessionObj.sessionFieldsDataLength, bytes, 2);
    encodeNum(sessionObj.creationTime, bytes, 8);
    encodeNum(sessionObj.lastAccessedTime, bytes, 8);
    encodeNum(sessionObj.maxInactive, bytes, 4);
    encodeBoolean(sessionObj.isNew, bytes);
    encodeBoolean(sessionObj.isValid, bytes);
    encodeNum(sessionObj.thisAccessedTime, bytes, 8);
    encodeNum(sessionObj.lastBackupTime, bytes, 8);

    var idResult = encodeString(sessionObj.id);
    console.log("id length "+idResult.length);
    encodeNum(idResult.length, bytes, 2);
    pushAll(bytes, idResult.data);

    encodeNum(sessionObj.authType, bytes, 2);

    var principalDataResult = encodeString(JSON.stringify(sessionObj.principalData));

    principalDataResult.length = 0; //msm 的bug

    encodeNum(principalDataResult.length, bytes, 2);
    if(principalDataResult.length == 0){
      encodeNum(0, bytes, 2);
      encodeNum(0, bytes, 2);
      pushAll(bytes, principalDataResult.data);
    }else{
      pushAll(bytes, principalDataResult.data);
      
      var savedRequestDataResult = encodeString(JSON.stringify(sessionObj.savedRequestData));
      encodeNum(savedRequestDataResult.length, bytes, 2);
      pushAll(bytes, savedRequestDataResult.data);

      var savedPrincipalDataResult = encodeString(JSON.stringify(sessionObj.savedPrincipalData));
      encodeNum(savedPrincipalDataResult.length, bytes, 2);
      pushAll(bytes, savedPrincipalDataResult.data);
    }
    return bytes;
  };


  var deserialize = function(dataBytes){
    var result = {};
    result.version = decodeNum(dataBytes, 0, 2);
    result.sessionFieldsDataLength = decodeNum(dataBytes, 2, 2);
    result.creationTime = decodeNum(dataBytes, 4, 8);
    result.lastAccessedTime = decodeNum(dataBytes, 12, 8);
    result.maxInactive = decodeNum(dataBytes, 20, 4);
    result.isNew = decodeBoolean(dataBytes, 24);
    result.isValid = decodeBoolean(dataBytes, 25);
    result.thisAccessedTime = decodeNum(dataBytes, 26, 8);
    result.lastBackupTime = decodeNum(dataBytes, 34, 8);
    result.idLength = decodeNum(dataBytes, 42, 2);
    result.id = decodeString(dataBytes, 44, result.idLength);
    result.authType = decodeNum(dataBytes, 44+result.idLength, 2);
    
    result.principalDataLength = decodeNum(dataBytes, 46+result.idLength, 2);
    if(result.principalDataLength == 0){
      result.principalData = JSON.parse(decodeString(dataBytes, result.sessionFieldsDataLength, dataBytes.length-result.sessionFieldsDataLength));
    }else{
      result.principalData = JSON.parse(decodeString(dataBytes, 48+result.idLength, result.principalDataLength));
    }
    
    result.savedRequestDataLength = decodeNum(dataBytes, 48+result.idLength+result.principalDataLength, 2);
    if(result.savedRequestDataLength != 0){
      result.savedRequestData = JSON.parse(decodeString(dataBytes, 50+result.idLength+result.principalDataLength, result.savedRequestDataLength));
    }
    
    result.savedPrincipalDataLength = decodeNum(dataBytes, 50+result.idLength+result.principalDataLength+result.savedRequestDataLength, 2);
    if(result.savedPrincipalDataLength != 0){
      result.savedPrincipalData = JSON.parse(decodeString(dataBytes, 52+result.idLength+result.principalDataLength+result.savedRequestDataLength, result.savedPrincipalDataLength));
    }
    
    return result;
  };


  exports.serialize = serialize;
  exports.deserialize = deserialize;
})();