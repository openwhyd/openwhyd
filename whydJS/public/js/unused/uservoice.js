var uservoiceOptions = {
  /* required */
  key: 'whyd',
  host: 'whyd.uservoice.com', 
  forum: '107273',
  lang: 'en',
  showTab: /*false*/ true,
  alignment: 'left',
  background_color:'#F24E4C', 
  text_color: 'white',
  hover_color: '#f00'
};

function _loadUserVoice() {
  var s = document.createElement('script');
  s.setAttribute('type', 'text/javascript');
  s.setAttribute('src', ("https:" == document.location.protocol ? "https://" : "http://") + "cdn.uservoice.com/javascripts/widgets/tab.js");
  document.getElementsByTagName('head')[0].appendChild(s);
}
_loadSuper = window.onload;
window.onload = (typeof window.onload != 'function') ? _loadUserVoice : function() { _loadSuper(); _loadUserVoice(); };