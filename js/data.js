/* =========================================================
   FasTrain — Dados de exemplo do sistema
   ========================================================= */
const TRAINS = [
  { id:'#0027', from:'Salvador', fromUF:'BA', to:'Rio de Janeiro', toUF:'RJ', status:'ativo', speed:'86KM/H', time:'2:55PM' },
  { id:'#0067', from:'Salvador', fromUF:'BA', to:'Rio de Janeiro', toUF:'RJ', status:'ativo', speed:'86KM/H', time:'8:35AM' },
  { id:'#0100', from:'Oslo',     fromUF:'OSL', to:'Vienna',        toUF:'VIE', status:'ativo', speed:'74KM/H', time:'4:10PM' },
  { id:'#0074', from:'Salvador', fromUF:'BA', to:'Rio de Janeiro', toUF:'RJ', status:'manutencao', speed:'00KM/H', time:'—' },
  { id:'#0001', from:'Los Angeles', fromUF:'LA', to:'New York', toUF:'NY', status:'ativo', speed:'86KM/H', time:'—' },
  { id:'#0820', from:'Salvador', fromUF:'BA', to:'Rio de Janeiro', toUF:'RJ', status:'ativo', speed:'86KM/H', time:'—' }
];

const SENSORS = [
  { id:'#0005', name:'Temperatura - vagão SSA 01', loc:'vagão SSA 01', status:'ativo', value:'28,8°C', when:'Hoje, 14:55', icon:'therm' },
  { id:'#0006', name:'Vibração - Eixo 3', loc:'Locomotiva RJ', status:'ativo', value:'2,4mm/s', when:'Hoje, 08:55', icon:'vib' },
  { id:'#0011', name:'Velocidade - trem 67', loc:'Conjunto LA 67', status:'ativo', value:'82KM/h', when:'Hoje, 16:10', icon:'gauge' },
  { id:'#0016', name:'Umidade - vagão RJ 27', loc:'vagão RJ 27', status:'manutencao', value:'--%', when:'Há 2 dias', icon:'drop' },
  { id:'#0021', name:'Corrente - Motor A', loc:'Vie - 09', status:'inativo', value:'--A', when:'Há 5 dias', icon:'bolt' }
];

const NOTIFICATIONS = [
  {
    id:'#0016', title:'Umidade - vagão RJ 27', loc:'vagão RJ 27', status:'manutencao',
    value:'--%', when:'Há 2 dias',
    msg:'Falha no sensor #0016. Favor encaminhar à manutenção.'
  }
];

function statusLabel(s){
  return s === 'ativo' ? 'Ativo' : s === 'manutencao' ? 'Manutenção' : 'Inativo';
}
function statusClass(s){
  return s === 'ativo' ? 'status-ativo' : s === 'manutencao' ? 'status-manutencao' : 'status-inativo';
}