<?php
header('Content-type: text/plain');
// replace with your credentials
$username = "YOUR_USERNAME";
$password = "YOUR_PASSWORD";
$hostname = "localhost";	
$database = "DB_NAME";

$dbh=mysql_connect ($hostname, $username, $password) or die ('I cannot connect to the database because: ' . mysql_error());
mysql_select_db ($database);

$first = 1;
$str = "";

$hubway_area = "02139,02138,02143,02142,02141,02215,02210,02199,02163,02135,02134,02129,02127,02125,02120,02119,02118,02116,02115,02114,02113,02111,02110,02109,02108,02446,02445";
$inner_metro = "02140,01890,01880,01801,02144,02478,02476,02474,02472,02468,02467,02466,02465,02461,02460,02459,02458,02453,02451,02421,02420,02180,02176,02155,02149,02148,02145,02152,02151,02150,02136,02132,02131,02130,02128,02126,02122,02121,01970,01945,01908,01907,01906,01905,01904,01902,02186,02171,02170,02169,02452";
$south_west = "02703,02025,02021,02375,02019,02357,02356,02048,02916,02911,02908,02906,02904,02896,02865,02864,01721,02863,02861,02860,02838,01702,01701,02802,01778,01776,01564,01560,01770,01545,01760,01542,01540,01748,01537,01746,01536,01534,01532,01527,01524,01522,01520,01519,02382,02379,02370,01505,01504,01503,02367,01501,02366,02364,02360,02359,02351,02347,02341,02339,02338,02333,02332,02330,02324,02302,02301,01772,01757,02066,01756,02061,01747,02050,02047,02045,02043,02493,01612,01611,01610,01609,01608,01607,01606,01605,01604,01603,01602,01590,01588,01583,01581,01568,02124,02762,02780,02779,02492,02482,02771,02769,02767,02766,02764,02368,02763,02343,02760,02322,02191,02190,02189,02188,02184,02093,02090,02081,02072,02071,02718,02067,02062,02715,02056,02054,02053,02052,02038,02035,02032,02030,02026";
$north = "01854,01966,01852,01960,01851,01460,01952,01450,01951,01434,01950,01949,01432,01944,01850,01827,01937,01826,01930,01824,01929,01821,01923,01803,01561,01922,01921,01915,01913,01901,01775,01773,01860,01845,01844,01843,01754,01749,01835,01523,01742,01833,01741,01832,01731,01830,01810,01730,01510,01467,01462,01453,01451,01420,01740,02452,01720,01719,01940,01887,01886,01879,01718,01474,01469,01464,01463,01985,01984,01983,01876,01982,01867,01864,01969,01863,01862";

function build_query()
{
	global $first, $str, $hubway_area, $inner_metro, $south_west, $north;
	if ( isset( $_GET['start_hour'] ) ){
		if ( $str != "" ){
			$str .= " AND";
		} 
		$str += " HOUR(start_date) >= ".$_GET['start_time']." AND HOUR(end_date) <= ".$_GET['end_time']." AND MINUTE(start_date) >= ".$_GET['start_minute']." AND MINUTE(end_date) <= ".$_GET['end_minute'];
	}
	if ( isset( $_GET['age'] ) ){
		if ( $str != "" ) {
			$str .= " AND";
		}
		$age = explode(",",$_GET['age']);
		$min = 2012-$age[0];
		$max = 2012-$age[1];
		$str .= " birth_date <= ".$min." AND birth_date >= ".$max;
	}
	if ( isset( $_GET['duration'] ) ){
		if ( $str != "" ) {
			$str .= " AND";
		}
		$dur = explode(",",$_GET['duration']);
		$str .= " duration >= ".$dur[0]." AND duration <= ".$dur[1];
	}
	if ( isset( $_GET['gender'] ) ){
		if ( $str != "" ) {
			$str .= " AND";
		}
		$str .= " gender='".$_GET['gender']."'";
	}
	if ( isset( $_GET['member'] ) ){
		if ( $str != "" ) {
			$str .= " AND";
		}
		$str .= " subscription_type='".$_GET['member']."'";
	}
	if ( isset( $_GET['months'] ) ){
		if ( $str != "" ) {
			$str .= " AND";
		}
		$str .= " MONTH(start_date) IN (".$_GET['months'].")";
	}
	if ( isset( $_GET['days'] ) ){
		if ( $str != "" ) {
			$str .= " AND";
		}
		$str .= " DAYOFWEEK(start_date) IN (".$_GET['days'].")";
	}
	if ( isset( $_GET['temp'] ) ){
		if ( $str != "" ) {
			$str .= " AND";
		}
		$temp = explode(",",$_GET['temp']);
		$str .= " temp >= ".$temp[0]." AND temp <= ".$temp[1];
	}
	if ( isset( $_GET['precip'] ) ){
		if ( $str != "" ) {
			$str .= " AND";
		}
		if ( $_GET['precip'] == 1 ) $str .= " precip > 0";
		else $str .= " precip = 0";
	}
	if ( isset( $_GET['dark'] ) ){
		if ( $str != "" ) {
			$str .= " AND";
		}
		$str .= " dark = ".$_GET['dark'];
	}
	if ( isset( $_GET['starttime'] ) ){
		if ( $str != "" ) {
			$str .= " AND";
		}
		$times = explode(",",$_GET['starttime']);
		$start = strtotime($times[0]);
		$end = strtotime($times[1]);
		if ( $end < $start ){
			$str .= " TIME(start_date) >= TIME(TIMESTAMP('2012-06-01 ".$times[0]."')) OR TIME(start_date) <= TIME(TIMESTAMP('2012-06-01 ".$times[1]."'))";
		} else {
			$str .= " TIME(start_date) >= TIME(TIMESTAMP('2012-06-01 ".$times[0]."')) AND TIME(start_date) <= TIME(TIMESTAMP('2012-06-01 ".$times[1]."'))";
		}
	}
	if ( isset( $_GET['endtime'] ) ){
		if ( $str != "" ) {
			$str .= " AND";
		}
		$times = explode(",",$_GET['endtime']);
		$start = strtotime($times[0]);
		$end = strtotime($times[1]);
		if ( $end < $start ){
			$str .= " TIME(end_date) >= TIME(TIMESTAMP('2012-06-01 ".$times[0]."')) OR TIME(end_date) <= TIME(TIMESTAMP('2012-06-01 ".$times[1]."'))";
		} else {
			$str .= " TIME(end_date) >= TIME(TIMESTAMP('2012-06-01 ".$times[0]."')) AND TIME(end_date) <= TIME(TIMESTAMP('2012-06-01 ".$times[1]."'))";
		}
	}
	if ( isset( $_GET['zip'] ) ){
		if ( $str != "" ) {
			$str .= " AND";
		}
		if ( $_GET['zip'] == "hubway_area" ) $z = $hubway_area;
		else if ( $_GET['zip'] == "inner_metro" ) $z = $inner_metro;
		else if ( $_GET['zip'] == "south_west" ) $z = $south_west;
		else if ( $_GET['zip'] == "north" ) $z = $north;
		$str .= " zip_code IN (".$z.")";
	}
}

build_query();
$query = "SELECT start_station_id, end_station_id FROM trips WHERE".$str;
$data = mysql_query($query);
$stations = array();
$json = '{';
if (!$data) {
	echo "Error";
} else {
	
	while ( $row = mysql_fetch_array($data) ){
		if ( $row[0] == 0 || $row[1] == 0 ) continue;
		if ( !isset( $stations[ $row[0] ] ) ) $stations[ $row[0] ] = array();
		if ( !isset( $stations[ $row[0] ][ $row[1] ] ) ) $stations[ $row[0] ][ $row[1] ] = 0;
		$stations[ $row[0] ][ $row[1] ]++;
	}
	
	$first_outer = true;
	foreach( $stations as $key => $value ){
		if ( !$first_outer ) $json.=',';
		else $first_outer = false;
		$json.='"'.$key.'":{';
		$first_inner = true;
		foreach ( $value as $ikey => $val ){
			if ( !$first_inner ) $json.=',';
			else $first_inner = false;
			$json.='"'.$ikey.'":'.$val;
		}
		$json.='}';
	}
	$json.='}';
	echo $json;
}
?>

