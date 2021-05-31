import React, { useEffect, useState } from 'react';

import {  StyleSheet, View, TouchableOpacity, Text, ToastAndroid, Vibration, ActivityIndicator, Image, Linking, PermissionsAndroid, ScrollView} from 'react-native';
import { Tab, Header, Overlay, Button, Input, ListItem, Icon } from 'react-native-elements';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Geolocation from 'react-native-geolocation-service';
import axios from 'axios';


const App = () => {
  const [sendPosition, setPosition] = useState('');
  const [history, setHistory] = useState(false);
  const [profile, setProfile] = useState(false);

  const [dataHistory, setDataHistory] = useState();

  const [forceUpdate, setForceUpdate] = useState(true);

  const [idUser, setIdUser] = useState();
  const [user, setUser] = useState();
  const [age, setAge] = useState();
  const [onCreate, setOnCreate] = useState();

  const keyApi = 'GET_YOUR_KEY';

  //pegando coordenadas do usuário
  const getLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        setPosition(position.coords.latitude+',++'+position.coords.longitude);
      },
      (error) => {
        console.log(error.code, error.message);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  }

  const getPage = (n) => {
    switch(n){
      case 1:
        setHistory(!history);
        break;
      case 2:
        setProfile(!profile);
        break;
    }
  }

  //pegando dados usuario, historico e permissões
  useEffect(() =>{
    (async () => {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        ]);
      } catch (err) {
        console.warn(err);
      }
    })();

    axios.get(`https://inlinetec.com/atp/?operation=view&option=user&key=${keyApi}`)
    .then(e => {
      if(e.data.status == 'VALID_REQUEST'){
        let res = e.data.result[0];
        setIdUser(res.id);
        setUser(res.name);
        setAge(res.age);
        setOnCreate(res.dateCreate);

        setForceUpdate(!forceUpdate);
      }
    })

    //pegando historico
    axios.get(`https://inlinetec.com/atp/?operation=view&option=history&key=${keyApi}`)
    .then(e => {
      if(e.data.status == 'VALID_REQUEST'){
        setDataHistory(e.data.result);
      }
    })

    return;
  }, [forceUpdate]);


  //att user
  const updateUser = () =>{
    axios.get(`https://inlinetec.com/atp/?operation=update&userName=${user}&key=${keyApi}`)
    .then(()=>{
      ToastAndroid.show('Sucesso ao atualizar dados do perfil', ToastAndroid.SHORT);
    }).catch(()=>{
      ToastAndroid.show('Falhou ao atualizar dados do perfil', ToastAndroid.SHORT);
    })
  }

  //del historico
  const delHistory = (n) => {
    axios.get(`https://inlinetec.com/atp/?operation=remove&idAlert=${n}&key=${keyApi}`)
    .then(()=>{
      ToastAndroid.show('Sucesso ao remover historico, basta atualizar', ToastAndroid.SHORT);
    }).catch(()=>{
      ToastAndroid.show('Falhou ao remover historico', ToastAndroid.SHORT);
    })

    setForceUpdate(!forceUpdate);
  }

  //inserindo alerta
  useEffect(()=>{
    if(sendPosition !== ''){
      axios.get(`https://inlinetec.com/atp/?operation=insert&idUser=${idUser}&geolocation=${sendPosition}&key=${keyApi}`)
      .then(()=>{
        ToastAndroid.show('Alerta foi feito, aguarde retorno das autoridades...', ToastAndroid.SHORT);
        setPosition('');
      }).catch(()=>{
        ToastAndroid.show('Falhou ao criar alerta, tente novamente', ToastAndroid.SHORT);
      })
    }
  }, [sendPosition]);

  const openGeoLocation = (gl) =>{
    const url = "https://www.google.com/maps/place/"+gl;

    Linking.openURL(url);
  }

  return (
    <SafeAreaProvider>
      <Header centerComponent={{ text: 'ALERT THE POLICE', style: { color: '#fff', fontSize: 20 } }}/>
      <Tab variant="primary" onChange={(e) => getPage(e)} indicatorStyle={{backgroundColor: '#fff'}}>
        <Tab.Item title="Inicio" icon={{ name: 'home', color: '#fff', size: 25 }} />
        <Tab.Item title="Histórico" icon={{ name: 'history', color: '#fff', size: 25 }} />
        <Tab.Item title="Perfil" icon={{ name: 'person', color: '#fff', size: 25 }}  />
      </Tab>
      <View style={styles.container}>
        <TouchableOpacity onPress={()=> {
          ToastAndroid.show('Criando alerta...', ToastAndroid.SHORT,ToastAndroid.CENTER);
          Vibration.vibrate(1000, 2000, 3000);
          getLocation()
          }} style={styles.btnAlert}>
          <Text style={styles.textAlert}>Alerta</Text>
        </TouchableOpacity>
        <ActivityIndicator size={300} style={styles.load} color="#fff" />
        <Text style={styles.footer}>© 2021 ATP | Eryc Ferreira</Text>
      </View>


      <Overlay isVisible={history} animationType="slide" overlayStyle={styles.profileScreen} onBackdropPress={() => setHistory(!history)}>
        <Text style={{position: 'absolute', left: 5, top: 5}}>/Histórico</Text>
        <ScrollView style={{width:'100%', height: '90%'}}>
          {dataHistory ? (
            dataHistory.map((l, i) => (
                <ListItem style={styles.listView} key={i} bottomDivider>
                  <Icon name='history' type='font-awesome' />
                  <ListItem.Content>
                    <ListItem.Title>{l.date}</ListItem.Title>
                    <ListItem.Subtitle onPress={()=>openGeoLocation(l.geolocation)}>Ver Localização</ListItem.Subtitle>
                  </ListItem.Content>
                  <Icon name='trash' type='font-awesome' onPress={()=> delHistory(l.id)} color='#e74c3c' />
                </ListItem>            
            ))
            ) : (<Text>Nenhum registro encontrado</Text>)}
        </ScrollView>
        <View style={styles.profileBtn}>
          <Button type="outline" icon={{ name: "exit-to-app", size: 20,color: "#2089dc"}} onPress={()=>setHistory(!history)} iconRight title="Fechar" />
        </View>
      </Overlay>

      <Overlay animationType="slide" isVisible={profile} overlayStyle={styles.profileScreen} onBackdropPress={() => setProfile(!profile)}>
        <Text style={{position: 'absolute', left: 5, top: 5}}>/Pefil</Text>
        <Image style={styles.profileImg} source={{uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Circle-icons-profile.svg/768px-Circle-icons-profile.svg.png'}}/>
        <Input placeholder="Nome" leftIcon={{ type: 'g-translate', name: 'emoji-people' }} value={user} onChangeText={setUser} />
        <Input placeholder="Idade" leftIcon={{ type: 'g-translate', name: 'cake' }} value={age+' Anos'} disabled/>
        <Input placeholder="Criado em" leftIcon={{ type: 'g-translate', name: 'calendar-today' }} value={onCreate} disabled/>
        <View style={styles.profileBtn}>
          <Button raised icon={{ name: "refresh", size: 20,color: "white"}} onPress={updateUser} iconRight title="Atualizar Pefil" />
          <Button type="outline" icon={{ name: "exit-to-app", size: 20,color: "#2089dc"}} onPress={()=>setProfile(!profile)} iconRight title="Fechar" />
        </View>
      </Overlay>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#181818',
    width: '100%',
    height: '80%',
    flexGrow: 1, 
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnAlert: {
    position: 'absolute',
    zIndex: 99999,
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D73C2C',
    borderRadius: 500,
    borderWidth: 15,
    borderColor: '#7F8C8D',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.48,
    shadowRadius: 8,

    elevation: 13,
  },
  profileScreen:{
    width: '90%',
    height: '90%',
    textAlign: 'center',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 20,
  },
  profileImg:{
    width: 150,
    height: 150,
    borderRadius: 80,
    borderWidth: 7,
    borderColor: '#7F8C8D',
  },
  listView:{
    height: 80,
    width: '100%', 
    justifyContent: 'space-around'
  },
  profileBtn:{
    height: 120,
    width: '80%', 
    justifyContent: 'space-around'
  },
  load: {
    zIndex: 0,
    position: 'absolute',
  },
  textAlert: {
    color: '#fff',
    fontSize: 40,
  },
  footer: {
    position: 'absolute',
    fontSize: 10,
    bottom: 20,
    alignSelf: 'center',
    textAlign: 'center',
    color: '#fff',
  },
});

export default App;
