$(document).ready(function(){
	$('.modal-btn-add').click(function(){
		$('#overlay').show();
		$('#myModal').show();
	});

	$('.close').click(function(){
		$('#overlay').hide();
		$('#myModal').hide();
		$('#start').val('');
		$('#end').val('');
		$('#title').val('');
		$('#description').val('');

		$('.planner-notes').attr('action','/event');
		$('.event-add').val('Add');
	});

	$('.editable-time a').click(function(e){
		e.preventDefault();
		var $event = $(this).parent().parent();
		var start = $event.attr('data-start');
		var end = $event.attr('data-end');
		var title = $event.attr('data-title');
		var description = $event.attr('data-description');

		$('#start').val(start);
		$('#end').val(end);
		$('#title').val(title);
		$('#description').val(description);

		$('.planner-notes').attr('action','/edit-event');
		$('.event-add').val('Edit');
		$('#overlay').show();
		$('#myModal').show();
	});
});