package fi.aapopihkala.snapshotwidget

import android.app.Activity
import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.os.Bundle
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import androidx.glance.appwidget.updateAll
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch

class SnapshotWidgetActivity : Activity() {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
    private lateinit var statusView: TextView
    private lateinit var refreshButton: Button

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(buildContentView())
        bootstrap()
    }

    override fun onDestroy() {
        scope.cancel()
        super.onDestroy()
    }

    private fun buildContentView(): View {
        val density = resources.displayMetrics.density
        fun dp(value: Int): Int = (value * density).toInt()

        val container = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            setPadding(dp(24), dp(36), dp(24), dp(24))
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT,
            )
        }

        container.addView(TextView(this).apply {
            text = getString(R.string.app_name)
            textSize = 26f
            gravity = Gravity.CENTER
        }, LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT,
        ))

        container.addView(TextView(this).apply {
            text = getString(R.string.startup_version, BuildConfig.VERSION_NAME)
            textSize = 14f
            gravity = Gravity.CENTER
        }, LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT,
        ).apply {
            topMargin = dp(8)
        })

        statusView = TextView(this).apply {
            text = getString(R.string.startup_starting)
            textSize = 17f
            gravity = Gravity.CENTER
        }
        container.addView(statusView, LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT,
        ).apply {
            topMargin = dp(40)
        })

        refreshButton = Button(this).apply {
            text = getString(R.string.startup_refresh)
            setOnClickListener { bootstrap() }
        }
        container.addView(refreshButton, LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT,
            ViewGroup.LayoutParams.WRAP_CONTENT,
        ).apply {
            topMargin = dp(28)
        })

        return container
    }

    private fun bootstrap() {
        val appContext = applicationContext
        refreshButton.isEnabled = false
        statusView.text = getString(R.string.startup_starting)

        // Opening this Activity is itself important on OEM builds that leave a
        // sideloaded widget-only package stopped/not-launched after installation.
        SnapshotUpdateWorker.ensurePeriodic(appContext)

        scope.launch {
            val refresh = runCatching { refreshSnapshotWidget(appContext) }
            val widgetCount = currentWidgetCount()

            statusView.text = when {
                refresh.isFailure -> getString(R.string.startup_failed)
                refresh.getOrNull() == false -> getString(R.string.startup_offline)
                widgetCount == 0 -> getString(R.string.startup_no_widget)
                else -> getString(R.string.startup_ready)
            }
            refreshButton.isEnabled = true
        }
    }

    private fun currentWidgetCount(): Int {
        val manager = AppWidgetManager.getInstance(this)
        val phone = ComponentName(this, SnapshotWidgetReceiver::class.java)
        val tablet = ComponentName(this, SnapshotTabletWidgetReceiver::class.java)
        return manager.getAppWidgetIds(phone).size + manager.getAppWidgetIds(tablet).size
    }
}
