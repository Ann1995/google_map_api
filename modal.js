var castomerLocation;
var markers = [];
var points = [];
var map;

var directionsDisplay;
var directionsService;

$(document).ready(function () {

    $('#ModalOpen').on('show.bs.modal', function () {
        resizeMap();
    });
    $(".dropdown-menu > li").on("click", function () {
        resizeMap();
    });

    getPoints();
    selectChange();

});

function Point(name, lat, lng, section, address, workDaysHours, workSaturdayHours, workSundayHours) {
    this.name = name;
    this.lat = lat;
    this.lng = lng;
    this.section = section;
    this.address = address;
    this.workDaysHours = workDaysHours;
    this.workSaturdayHours = workSaturdayHours;
    this.workSundayHours = workSundayHours;
}


function getPoints() {
    $.ajax({
        url: "/map.json",
        success: function (data) {

            for (var i = 0; i < data.length; i++) {
                var item = data[i];
                points[i] = new Point(item[0], item[1], item[2], item[3], item[4], item[5], item[6], item[7]);
            }
            PopulateMapByMarkers();
        }

    });
}

function selectChange() {
    $('ul.dropdown-menu > li').on('click', function () {

        var section = this.value;
        $("#ul").empty();

        for (var i = 0; i < points.length; i++) {
            var localSection = points[i].section;

            if (localSection == section) {
                $("#ul").append($('<li>')
                    .attr("marketId", i)
                 .attr("style", "cursor:pointer;margin:3%")
                 .html("<b>" + points[i].name + "</b>" + "<br/>" + points[i].address + '<br/>' + points[i].workDaysHours + " " + '<i>' + "<br/>"))
                $("i").attr("class", "glyphicon glyphicon-map-marker");
            };
        }

        $('#ul').delegate('li', 'click', function () {
            var index = $(this).attr("marketId");
            var marker = getMarkerByIndex(index);

            map.panTo(marker.getPosition());
            calculateAndDisplayRoute(marker.getPosition());
        });
    });
}

function getMarkerByIndex(index) {
    var result = markers[index];
    return result;
}

function PopulateMapByMarkers() {

    for (var i = 0; i < points.length; i++) {

        var marker = new google.maps.Marker({
            position: { lat: points[i].lat, lng: points[i].lng },
            icon: "ico.png",
            map: map
        });
        marker.addListener('click', function () {

            map.panTo(this.getPosition());
            calculateAndDisplayRoute(this.getPosition());
        });

        markers.push(marker);
    }
}



function rad(x) { return x * Math.PI / 180; }
function findNearest() {
    if (castomerLocation) {
        var lat = castomerLocation.lat;
        var lng = castomerLocation.lng;
        var R = 6371;
        var distances = [];
        var closest = -1;
        for (i = 0; i < markers.length; i++) {
            var mlat = markers[i].position.lat();
            var mlng = markers[i].position.lng();
            var dLat = rad(mlat - lat);
            var dLong = rad(mlng - lng);
            var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(rad(lat)) * Math.cos(rad(lat)) * Math.sin(dLong / 2) * Math.sin(dLong / 2);
            var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            var d = R * c;
            distances[i] = d;
            if (closest == -1 || d < distances[closest]) {
                closest = i;
            }
        }

        map.panTo(markers[closest].getPosition());
        calculateAndDisplayRoute(markers[closest].getPosition());
    } else {
        alert("Castomer Location is unknown.");
    }
}

function resizeMap() {
    if (typeof map == "undefined") return;
    setTimeout(function () { resizingMap(); }, 400);
}

function resizingMap() {
    if (typeof map == "undefined") return;
    var center = map.getCenter();
    google.maps.event.trigger(map, "resize");
    map.setCenter(center);
}

window.initMap = function () {

    var ukrainLocation = { lat: 48.7061167, lng: 31.9400037 };
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 6,
        center: ukrainLocation
    });

    directionsDisplay = new google.maps.DirectionsRenderer;
    directionsService = new google.maps.DirectionsService;

    directionsDisplay.setMap(map);


    var infoWindow = new google.maps.InfoWindow({ map: map });

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            var pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            castomerLocation = pos;

            infoWindow.setContent('ваше місцезнаходження');
            infoWindow.setPosition(pos);

            map.setCenter(pos);
        }, function () {
            handleLocationError(true, infoWindow, map.getCenter());
        });
    } else {
        // Browser doesn't support Geolocation
        handleLocationError(false, infoWindow, map.getCenter());
    }
}

function handleLocationError(browserHasGeolocation, infoWindow, pos) {
    infoWindow.setPosition(pos);
    infoWindow.setContent(browserHasGeolocation ?
                          'Error: The Geolocation service failed.' :
                          'Error: Your browser doesn\'t support geolocation.');
}

function calculateAndDisplayRoute(destination) {
    directionsService.route({
        origin: castomerLocation,
        destination: destination,
        travelMode: google.maps.TravelMode['DRIVING']
    },
    function (response, status) {
        if (status == google.maps.DirectionsStatus.OK) {
            directionsDisplay.setDirections(response);
        } else {
            window.alert('Directions request failed due to ' + status);
        }
    });
}