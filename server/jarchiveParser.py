import re
import random
import requests
from bs4 import BeautifulSoup


class JarchiveParser:
    def choose_random_episode(self):
        all_seasons_url = "https://www.j-archive.com/listseasons.php"
        html = requests.get(all_seasons_url).content
        soup = BeautifulSoup(html, "lxml")
        season_html_urls = soup.find("div", {"id": "content"}).findAll("a")
        earliest_season = 27  # ~2010
        latest_season = 36  # ~2019
        season_html_urls_in_range = [
            s
            for s in season_html_urls
            if self.is_season_within_range(s.text, earliest_season, latest_season)
        ]
        random_season_html_url = random.choice(season_html_urls_in_range)

        season_url = f"https://www.j-archive.com/{random_season_html_url.get('href')}"
        single_season_html = requests.get(season_url).content
        soup = BeautifulSoup(single_season_html, "lxml")
        episode_html_urls = soup.find("div", {"id": "content"}).findAll("a")
        valid_episode_html_urls = [
            html
            for html in episode_html_urls
            if "j-archive.com/showgame" in html.get("href")
        ]
        random_episode_html_url = random.choice(valid_episode_html_urls)
        episode_url = random_episode_html_url.get("href")
        if "j-archive.com/showgame" in episode_url:
            return {
                "jarchive_id": episode_url.split("?game_id=")[-1],
                "url": episode_url,
                "taped": random_episode_html_url["title"].split()[-1]
                if "title" in random_episode_html_url.attrs
                else None,
            }

    def is_season_within_range(self, season_str, earliest_season, latest_season):
        pattern = re.compile("Season (\d+)")
        result = pattern.search(season_str)

        if result is None:
            # The season name is not even of the regular form "Season X".
            return False

        # The season name is of the regular form "Season X". Extract X and check if it
        # is within the years we want.
        season_num_str = result.group(1)
        season_num = int(season_num_str)
        return earliest_season <= season_num <= latest_season

    def get_category_info(self, first_row, round_type):
        category_info = []
        col_order_index = 0
        for single_row_data in first_row.find_all("td", recursive=False):
            category_text = single_row_data.find("td", {"class": "category_name"}).text
            category_info.append(
                {
                    "col_order_index": col_order_index,
                    "text": category_text,
                    "round_type": round_type,
                }
            )
            col_order_index += 1
        return category_info

    def get_all_clue_text(self, all_rows):
        all_clue_text = []
        for row in all_rows[1:]:
            all_row_data = row.find_all("td", recursive=False)
            for single_row_data in all_row_data:
                is_daily_double = False
                clue_value_daily_double_html = single_row_data.find(
                    "td", {"class": "clue_value_daily_double"}
                )
                if clue_value_daily_double_html:
                    is_daily_double = True
                clue_html = single_row_data.find("td", {"class": "clue_text"})
                if clue_html:
                    clue_text = clue_html.text
                    answer_text = (
                        BeautifulSoup(
                            single_row_data.find("div")["onmouseover"], "lxml"
                        )
                        .find("em", {"class": "correct_response"})
                        .text
                    )
                else:
                    clue_text = None
                    answer_text = None
                all_clue_text.append(
                    {
                        "clue": clue_text,
                        "answer": answer_text,
                        "is_daily_double": is_daily_double,
                    }
                )
        return all_clue_text

    def get_ordered_dollar_values(self, all_rows):
        all_dollar_values = []
        for row in all_rows[1:]:
            all_row_data = row.find_all("td", recursive=False)
            for single_row_data in all_row_data:
                clue_value_html = single_row_data.find("td", {"class": "clue_value"})
                if clue_value_html:
                    all_dollar_values.append(
                        int(clue_value_html.text[1:])
                    )  # Remove the $ and convert to int
        return list(set(all_dollar_values))

    def get_jeopardy_round(self, soup, is_double_jeop):
        round_name_html = (
            "double_jeopardy_round" if is_double_jeop else "jeopardy_round"
        )
        round_name_db = "double" if is_double_jeop else "single"
        clue_table = soup.find("div", {"id": round_name_html}).find(
            "table", {"class": "round"}
        )
        rows = clue_table.find_all("tr", recursive=False)
        category_info = self.get_category_info(
            first_row=rows[0], round_type=round_name_db
        )
        all_clue_text = self.get_all_clue_text(rows)
        clue_info = []
        clue_idx = 0
        for dollar_value in self.get_ordered_dollar_values(rows):
            for col_info in category_info:
                clue_info.append(
                    {
                        "question_and_answer": all_clue_text[clue_idx],
                        "money": dollar_value,
                        "category_info": col_info,
                    }
                )
                clue_idx += 1
        return clue_info

    def get_final_round(self, soup):
        clue_table = soup.find("div", {"id": "final_jeopardy_round"}).find(
            "table", {"class": "final_round"}
        )
        category_name = clue_table.find("td", {"class": "category_name"}).text
        clue_text = clue_table.find("td", {"class": "clue_text"}).text
        answer_html_str = str(
            BeautifulSoup(clue_table.find("div")["onmouseover"], "lxml")
        )
        answer_html_str_bw_parens = answer_html_str[
            answer_html_str.find("(") + 1 : answer_html_str.rfind(")")
        ]
        final_answer = (
            BeautifulSoup(answer_html_str_bw_parens, "lxml")
            .find("html")
            .find("em", {"class": "correct_response"})
            .text
        )
        return [
            {
                "question_and_answer": {
                    "clue": clue_text,
                    "answer": final_answer,
                    "is_daily_double": False,
                },
                "money": None,
                "category_info": {
                    "col_order_index": None,
                    "text": category_name,
                    "round_type": "final",
                },
            }
        ]

    def parse(self):
        random_episode = None
        while random_episode is None or random_episode["taped"] is None:
            random_episode = self.choose_random_episode()
        html = requests.get(random_episode["url"]).content
        soup = BeautifulSoup(html, "lxml")
        game_title = soup.find("div", {"id": "game_title"}).find("h1").text
        clues = []
        clues += self.get_jeopardy_round(soup, is_double_jeop=False)
        clues += self.get_jeopardy_round(soup, is_double_jeop=True)
        clues += self.get_final_round(soup)
        return {
            "game_title": game_title,
            "episode_details": random_episode,
            "clues": clues,
        }


# if __name__ == "__main__":
#     random_game_info = JarchiveParser().parse()
