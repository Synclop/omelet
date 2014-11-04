var jQuery = require('jquery')
,	filedrop = require('./jquery.filedrop')
;

jQuery(function($){


	function message(message,type){
		console.log(message,type);
	}

	function checkCheckBoxes($container){
		var checked = $container.find("input[type=checkbox]:checked").length;
		return checked;
	}

	function getColorPatterns(keywords,cb){
		$.ajax({
			url:'http://www.colourlovers.com/api/patterns'
		,	data:{
				keywords:keywords.replace(/\s/g,'+')
			,	format:'json'
			,	numResults:10
			}
		,	jsonp:'jsonCallback'
		,	dataType:'jsonp'
		,	success:cb
		});
	}

	function getDomainSuggestions(domain,cb){
		$.ajax({
			url:'https://domainr.com/api/json/search'
		,	data:{
				q:domain
			}
		,	jsonp:'callback'
		,	dataType:'jsonp'
		,	success:function(data){
				var res = data.results;
				var ret = [];
				for(var i = 0,l=res.length;i<l;i++){
					if(res[i].availability!='available'){continue;}
					ret.push(res[i]);
				}
				if(!l || !ret.length){cb(false);}
				cb(ret);
			}
		})
	}

	function setColorInputColor($input,val){
		$input.val(val);
		var $p = $input.parent();
		$p.find('.color-box').css('background',val);
		$p.find('.icon').css('color',val);
	}

	(function(){

		var showPageByElement = function($page){
			$fieldsets.not($page).removeClass('active');
			$page.addClass('active').find('input:first,textarea:first').focus();
		}

		var $fieldsets = $('.omelet fieldset');

		var hash = window.location.hash;

		if(!hash){
			window.location.hash = $fieldsets[0].id;
		}

	})();

	$('.omelet .revealers input').each(function(){
		var name = this.name;
		var $affected = $('.hidden[data-revealOn="'+name+'"]');
		$(this).on('change',function(evt){
			var val = this.checked && $(this).val();
			if(val){
				var $current = $affected.filter('[data-choice="'+val+'"]').addClass('active').hide().slideDown();
				$affected.not($current).removeClass('active').hide().find('input').attr('required',false);
				$current.find('input:first').attr('required',true).focus().trigger('keyup');
			}
			else{
				$affected.removeClass('active').hide().find('input').attr('required',false);
			}
		});
	});

	$('.omelet').on('blur','input',function(){
		$(this).data('tainted',true);
	});


	(function(supported){

		if(!supported){
			alert('file apis not supported');
			return;
		}

		function getExtension(filename){
			var a = filename.split(".");
			if(a.length === 1 || (a[0] === "" && a.length === 2)){return "";}
			return a.pop();
		}

		function addThumbnail(file,$insert){
			var ext = getExtension(file.name);
			var preview = $('<div class="thumb '+ext+'"/>');
			var title = $('<span class="thumb-title">'+file.name+'</span>');
			var type = $('<span class="thumb-type">'+ext+'</span>');
			preview.append(title).append(type);
			var reader = new FileReader();
			reader.onload = function(e){
				if(file.type.match(/jpeg|jpg|gif|png|bmp|ico/)){
					console.log(preview)
					preview.css('background-image',e.target.result)
				}
				preview.addClass('thumb-loaded')
			};
			reader.readAsDataURL(file);
			$insert.prepend(preview);
			$.data(file,preview);
		}

		function handleFileSelect(files,$insert){
			if(!files.length){return;}
			for (var i = 0, f; f = files[i]; i++) {
				//var reader = new FileReader();
				//reader.onload = addThumbnail(f,$insert);
				//reader.readAsDataURL(f);
			}
		}

		var $upload = $('input.uploadInput').on('change',function(evt){
			evt.preventDefault();
			var files = evt.target.files;
			handleFileSelect(files,$uploadCanvas);
			return false;
		});

		var filedropOptions = {
			fallback_id: $upload.attr('id')
		,	paramname: $upload.attr('name')
		//,	url:''
		,	withCredentials:true
		,	allowedfiletypes: ['image/jpeg','image/png','image/x-icon','image/vnd.microsoft.icon','image/bmp','image/gif','application/postscript','application/eps','application/x-eps','image/eps','image/x-eps','image/svg+xml','image/vnd.dxf']
		,	allowedfileextensions: ['.jpg','.ico','.jpeg','bmp','.png','.gif','.ai','.eps','.svg','.svgz','.dxf']
		,	maxfiles: 25
		,	maxfilesize: 20
		,	error: function(err, file) {
				var name = file.name;
				switch(err) {
					case 'BrowserNotSupported':
						message('browser does not support HTML5 drag and drop','error')
						break;
					case 'TooManyFiles':
						message('you are only allowed to post '+filedropOptions.maxfiles+' files','error')
						break;
					case 'FileTooLarge':
						message('file "'+name+'" is too large. You can upload files up to '+filedropOptions.maxfilesize+'mb only','error')
						break;
					case 'FileTypeNotAllowed':
						message('the file "'+name+'" is not allowed. You can only upload files in the following format: '+allowedfileextensions.join(','))
						break;
					case 'FileExtensionNotAllowed':
						message('the file "'+name+'" doesn\'t have the right extensions. You can only upload files with the following extensions: '+allowedfileextensions.join(','))
						break;
					default:
						message("an unknown error has occurred")
						break;
				}
			}	
		,	dragOver:function(e){
				$dropZone.addClass('draggedOver');
			}
		,	dragLeave:function(e){
				$dropZone.removeClass('draggedOver');
			}
		,	drop:function(e){
				$dropZone.removeClass('draggedOver');
				var files = e.dataTransfer.files;
			}
		,	uploadFinished: function(i, file, response, time){
				addThumbnail(file,$uploadCanvas);
			}
		,	beforeEach: function(file) {
				console.log('before',file.name)
			}
		}


		var $dropZone = $('.uploadDropZone').filedrop(filedropOptions);
		var $uploadCanvas = $dropZone.find('.uploadDropZoneInside');

	})(window.File && window.FileReader && window.FileList && window.Blob);

	(function(){
		var fields = {
			domainSearch: $('#domainSearch')
		,	providers: $('.provider-address')
		,	company: $('#company')
		,	domain: $('#domain')
		,	colorSearch: $('#colorSearch')
		};

		function checkField(field,defVal){
			if(!field.data('tainted') || !field.val()){
				field.val(defVal);
			}
		}

		fields.company.on('blur',function(){
			var val = $(this).val();
			if(!val){return;}
			checkField(fields.domainSearch,val);
			checkField(fields.domain,'http://www.'+val+'.com');
			checkField(fields.colorSearch,val);
			fields.providers.each(function(){
				var $i = $(this);
				checkField($i,'http://www.'+$i.data('provider')+'.com/'+val);
			});
		});

		var $colorSearchResults = fields.colorSearch.parent().siblings('.resultField');
		var $colorSearchResultsDisplay = $colorSearchResults.find('.resultFieldResults');
		var $domainSearchResults = fields.domainSearch.parent().siblings('.resultField');
		var $domainSearchResultsDisplay = $domainSearchResults.find('.resultFieldResults');
		var colorSearchResultsTimeOut;
		var domainSearchResultsTimeOut;
		var previousColorSearchTerms;
		var previousDomainSearchTerms;
		var colorSearchResultsFieldSetActive = function(){$colorSearchResultsDisplay.addClass('toggled');};
		var domainSearchResultsFieldSetActive = function(){$domainSearchResultsDisplay.addClass('toggled');};
		var updateColorSearchResults = function(){
			var val = fields.colorSearch.val();
			if(!val || val == previousColorSearchTerms){return;}
			previousColorSearchTerms = val;
			$colorSearchResults.removeClass('loaded').addClass('loading');
			$colorSearchResultsDisplay.removeClass('toggled');
			getColorPatterns(val,function(patterns){
				str='';
				$.each(patterns,function(c){
					var colors = this.colors;
					str+= '<label for="pattern-'+this.id+'" class="colorPattern" data-id="'+this.id+'">'+
						'<span class="patternColors" data-has="'+colors.length+'">';
					for(var i=0,l=colors.length;i<l;i++){
						str+='<span class="patternColor" style="background-color:#'+colors[i]+'" data-color="'+colors[i]+'"></span>';
					}
					str+='</span><span class="title">'+this.title+'</span><input type="radio" value="'+this.id+'" id="pattern-'+this.id+'" name="colorPattern"></label>';
				});
				$colorSearchResults.removeClass('loading').addClass('loaded');
				$colorSearchResultsDisplay.empty().append(str);
				clearTimeout(colorSearchResultsTimeOut);
				colorSearchResultsTimeOut = setTimeout(colorSearchResultsFieldSetActive,1000);
			});
		};
		var updateDomainResults = function(){
			var val = fields.domainSearch.val();
			if(!val || val == previousDomainSearchTerms){return;}
			previousDomainSearchTerms=val;
			$domainSearchResults.removeClass('loaded').addClass('loading');
			$domainSearchResultsDisplay.removeClass('toggled');
			getDomainSuggestions(val,function(results){
				str='';
				if(!results){
					str='<span class="search-error">Could not find any results!</span>';
				}else{
					$.each(results,function(){
						var d = this.domain
						str+='<div class="domain" data-domain="'+d+'"><span class="domain-name">'+d+'</span><span class="domain-buy"><a href="https://domainr.com/api/register?domain='+d+'" title="buy '+d+'" target="_blank">buy</a></span></div>';
					});
				}
				$domainSearchResults.removeClass('loading').addClass('loaded');
				$domainSearchResultsDisplay.empty().append(str);
				clearTimeout(domainSearchResultsTimeOut);
				domainSearchResultsTimeOut = setTimeout(domainSearchResultsFieldSetActive,1000);
			});
		}
		var colorTypingTimer;
		var domainTypingTimer;
		var doneTypingInterval = 1000;
		fields.colorSearch.on('keyup',function(){
			clearTimeout(colorTypingTimer);
			colorTypingTimer = setTimeout(updateColorSearchResults, doneTypingInterval);
		}).on('keydown',function(){
			clearTimeout(colorTypingTimer);
		});

		fields.domainSearch.on('keyup',function(){
			clearTimeout(domainTypingTimer);
			domainTypingTimer = setTimeout(updateDomainResults, doneTypingInterval);
		}).on('keydown',function(){
			clearTimeout(domainTypingTimer);
		});

		$colorSearchResultsDisplay.on('click','.colorPattern',function(){
			var $s = $(this);
			$s.addClass('selected').siblings().removeClass('selected');
			$s.find('.patternColor').each(function(i){
				var $i = $('input#color'+i)
				var c = $(this).data('color');
				setColorInputColor($i,'#'+c);
			});
		});

		$domainSearchResultsDisplay.on('click','.domain',function(){
			var $d = $(this);
			$d.addClass('selected').siblings().removeClass('selected');
			var d = $d.data("domain");
			fields.domain.val(d);
		})

	})();

	(function(){
		var $colors = $('#omelet-colors');

		$('.colorPick').on('click',function(){
			var val = $(this).data('value');
			var $linked = $('#'+$colors.data('link'));
			setColorInputColor($linked,val);
			$colors.removeClass('toggled');
		});

		$('input.color').click(function(evt){
			$colors.data('link',this.id).addClass('toggled');
		});
	})();

	(function(){

		$('.inputField textarea, .inputField input').on('change keyup',function(evt){
			var f = evt.target;
			var recapFieldId = 'Recap-'+f.id;
			var value = f.value;
			var recapField = document.getElementById(recapFieldId);
			recapField.innerHTML = value;
		})

	})();

});