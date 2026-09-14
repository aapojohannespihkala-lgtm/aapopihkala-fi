package fi.aapopihkala.snapshotwidget

import android.widget.RemoteViews
import androidx.compose.runtime.Composable
import androidx.glance.GlanceModifier
import androidx.glance.LocalContext
import androidx.glance.appwidget.AndroidRemoteViews

@Composable
internal fun LiveRefreshSpinner(
    modifier: GlanceModifier = GlanceModifier,
) {
    val context = LocalContext.current
    AndroidRemoteViews(
        remoteViews = RemoteViews(context.packageName, R.layout.widget_refresh_spinner),
        modifier = modifier,
    )
}
