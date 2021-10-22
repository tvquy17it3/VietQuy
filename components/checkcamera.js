import {PermissionsAndroid} from 'react-native';

export const checkPermission = async ()=>{
  const result =  await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
  return result;
}
