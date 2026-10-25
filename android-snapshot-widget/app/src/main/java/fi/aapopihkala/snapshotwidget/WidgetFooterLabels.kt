package fi.aapopihkala.snapshotwidget

/**
 * Normal-state footer label. The installed APK version is appended so a sideloaded
 * update can be confirmed at a glance. Failure states keep their diagnostics instead,
 * because those labels already use most of the single footer line.
 */
internal fun updatedFooterLabel(payloadTime: String, versionName: String?): String {
    val version = versionName?.trim().orEmpty()
    return if (version.isEmpty()) "UPDATED $payloadTime" else "UPDATED $payloadTime · $version"
}
