"""
MIT License

Copyright (c) 2020 Airbyte

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
"""
from typing import Dict

from airbyte_protocol import AirbyteCatalog, AirbyteConnectionStatus, Status, SyncMode
from base_python import AirbyteLogger, CatalogHelper, ConfigContainer
from base_singer import SingerSource, SyncModeInfo

TAP_CMD = "tap-marketo"


class SourceMarketoSinger(SingerSource):
    def __init__(self):
        super().__init__()

    def transform_config(self, raw_config):
        return {
            "endpoint": raw_config["endpoint_url"],
            "identity": raw_config["identity_url"],
            "client_id": raw_config["client_id"],
            "client_secret": raw_config["client_secret"],
            "start_date": raw_config["start_date"],
        }

    def check(self, logger: AirbyteLogger, config_container: ConfigContainer) -> AirbyteConnectionStatus:
        try:
            self.discover(logger, config_container)
            return AirbyteConnectionStatus(status=Status.SUCCEEDED)
        except Exception as e:
            logger.error("Exception while connecting to the Marketo API")
            logger.error(str(e))
            return AirbyteConnectionStatus(
                status=Status.FAILED, message="Unable to connect to the Marketo API with the provided credentials. "
            )

    def discover_cmd(self, logger: AirbyteLogger, config_path: str) -> str:
        return f"{TAP_CMD} -c {config_path} --discover"

    def get_sync_mode_overrides(self) -> Dict[str, SyncModeInfo]:
        incremental_streams = ["leads",
                               "activities_visit_webpage",
                               "activities_fill_out_form",
                               "activities_click_link",
                               "activities_send_email",
                               "activities_email_delivered",
                               "activities_email_bounced",
                               "activities_unsubscribe_email",
                               "activities_open_email",
                               "activities_click_email",
                               "activities_new_lead",
                               "activities_change_data_value",
                               "activities_change_score",
                               "activities_add_to_list",
                               "activities_remove_from_list",
                               "activities_email_bounced_soft",
                               "activities_merge_leads",
                               "activities_add_to_opportunity",
                               "activities_remove_from_opportunity",
                               "activities_update_opportunity",
                               "activities_delete_lead",
                               "activities_send_alert",
                               "activities_send_sales_email",
                               "activities_open_sales_email",
                               "activities_click_sales_email",
                               "activities_receive_sales_email",
                               "activities_request_campaign",
                               "activities_sales_email_bounced",
                               "activities_change_lead_partition",
                               "activities_change_revenue_stage",
                               "activities_change_revenue_stage_manually",
                               "activities_change_status_in_progression",
                               "activities_change_segment",
                               "activities_call_webhook",
                               "activities_sent_forward_to_friend_email",
                               "activities_received_forward_to_friend_email",
                               "activities_add_to_nurture",
                               "activities_change_nurture_track",
                               "activities_change_nurture_cadence",
                               "activities_change_program_member_data",
                               "activities_push_lead_to_marketo",
                               "activities_share_content",
                               "campaigns",
                               "lists",
                               "programs"]

        return {s: SyncModeInfo([SyncMode.incremental], True, []) for s in incremental_streams}

    def read_cmd(self, logger: AirbyteLogger, config_path: str, catalog_path: str, state_path: str = None) -> str:
        # We don't pass in state to force the tap to run in full refresh since this tap does not respect the replication-method flag.
        state_opt = f"--state {state_path}" if state_path else ""
        return f"{TAP_CMD} -c {config_path} -p {catalog_path} {state_opt}"
