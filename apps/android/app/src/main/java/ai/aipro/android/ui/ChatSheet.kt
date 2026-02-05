package ai.aipro.android.ui

import androidx.compose.runtime.Composable
import ai.aipro.android.MainViewModel
import ai.aipro.android.ui.chat.ChatSheetContent

@Composable
fun ChatSheet(viewModel: MainViewModel) {
  ChatSheetContent(viewModel = viewModel)
}
