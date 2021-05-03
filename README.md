<html lang="pl">
<head>
	<meta charset="UTF-8">
	<meta name="author" content="Xslash">
</head>
<body style="background-color:grey;">
	<h1>test</h1>
</body>
	<script>
		const queryString = window.location.search;
		const urlParams = new URLSearchParams(queryString);
		window.location.replace("cubeventure://" + urlParams.get('access_token'));
	</script>
</html>
