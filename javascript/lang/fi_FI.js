if(typeof(ss) == 'undefined' || typeof(ss.i18n) == 'undefined') {
	if(typeof(console) != 'undefined') console.error('Class ss.i18n not defined');
} else {
	ss.i18n.addDictionary('fi_FI', {
		'DialogDataObjectManager.SAVE': 'Tallenna',
		'DialogDataObjectManager.CLOSE': 'Sulje',
		'DialogDataObjectManager.DELETE': 'Poista?',
		'DialogDataObjectManager.SEARCH': 'Etsi'
	});
}