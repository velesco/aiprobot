package ai.aipro.android.protocol

import org.junit.Assert.assertEquals
import org.junit.Test

class AiproProtocolConstantsTest {
  @Test
  fun canvasCommandsUseStableStrings() {
    assertEquals("canvas.present", AIProCanvasCommand.Present.rawValue)
    assertEquals("canvas.hide", AIProCanvasCommand.Hide.rawValue)
    assertEquals("canvas.navigate", AIProCanvasCommand.Navigate.rawValue)
    assertEquals("canvas.eval", AIProCanvasCommand.Eval.rawValue)
    assertEquals("canvas.snapshot", AIProCanvasCommand.Snapshot.rawValue)
  }

  @Test
  fun a2uiCommandsUseStableStrings() {
    assertEquals("canvas.a2ui.push", AIProCanvasA2UICommand.Push.rawValue)
    assertEquals("canvas.a2ui.pushJSONL", AIProCanvasA2UICommand.PushJSONL.rawValue)
    assertEquals("canvas.a2ui.reset", AIProCanvasA2UICommand.Reset.rawValue)
  }

  @Test
  fun capabilitiesUseStableStrings() {
    assertEquals("canvas", AIProCapability.Canvas.rawValue)
    assertEquals("camera", AIProCapability.Camera.rawValue)
    assertEquals("screen", AIProCapability.Screen.rawValue)
    assertEquals("voiceWake", AIProCapability.VoiceWake.rawValue)
  }

  @Test
  fun screenCommandsUseStableStrings() {
    assertEquals("screen.record", AIProScreenCommand.Record.rawValue)
  }
}
