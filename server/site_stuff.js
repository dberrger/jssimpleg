function about() {
    document.getElementById("about").style.display = "block";
    document.getElementById("scoreboard").style.display = "none";
    document.getElementById("howto").style.display = "none";
}
function howto() {
    document.getElementById("howto").style.display = "block";
    document.getElementById("about").style.display = "none";
    document.getElementById("scoreboard").style.display = "none";
}
function leaderboard() {
    document.getElementById("scoreboard").style.display = "block";
    document.getElementById("howto").style.display = "none";
    document.getElementById("about").style.display = "none";
}
