package ro.aipro.android.ui

import androidx.compose.runtime.Composable
import ro.aipro.android.MainViewModel
import ro.aipro.android.ui.chat.ChatSheetContent

@Composable
fun ChatSheet(viewModel: MainViewModel) {
  ChatSheetContent(viewModel = viewModel)
}
