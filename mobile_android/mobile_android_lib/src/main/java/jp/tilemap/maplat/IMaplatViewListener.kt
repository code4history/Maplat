package jp.tilemap.maplat

/**
 * Created by kokogiko on 2018/05/06.
 */

interface IMaplatViewListener {
    fun onReady()
    fun onClickMarker(markerId: String, markerData: Any?)
    fun onChangeViewpoint(x: Double, y: Double, latitude: Double, longitude: Double, mercator_x: Double,
                          mercator_y: Double, zoom: Double, merc_zoom: Double, direction: Double, rotation: Double)

    fun onOutOfMap()
    fun onClickMap(latitude: Double, longitude: Double)
}