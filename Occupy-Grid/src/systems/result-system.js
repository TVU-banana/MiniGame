(function () {
  const ns = window.OccupyGrid;
  const cfg = ns.CONFIG;

  class ResultSystem {
    buildSummary(players, reason, elapsedMs) {
      const ranking = this.buildRanking(players, reason);
      const humanRank = ranking.findIndex((p) => p.id === cfg.PLAYER_IDS.HUMAN) + 1;
      const winner = ranking.length > 0 ? ranking[0] : null;
      return {
        reason: reason,
        durationMs: elapsedMs,
        ranking: ranking,
        humanRank: humanRank,
        winnerId: winner ? winner.id : null,
        winnerName: winner ? winner.name : ""
      };
    }

    buildRanking(players, reason) {
      const cloned = players.slice().map((p) => Object.assign({}, p));
      const humanId = cfg.PLAYER_IDS.HUMAN;

      if (reason === "human_dead") {
        const aliveNonHuman = cloned
          .filter((p) => p.alive && p.id !== humanId)
          .sort((a, b) => b.territoryCells - a.territoryCells);
        const human = cloned.find((p) => p.id === humanId);
        const deadOthers = cloned
          .filter((p) => !p.alive && p.id !== humanId)
          .sort((a, b) => this.compareDead(a, b));
        const arr = aliveNonHuman.concat(human ? [human] : [], deadOthers);
        for (let i = 0; i < arr.length; i += 1) {
          arr[i].rank = i + 1;
        }
        return arr;
      }

      const alive = cloned
        .filter((p) => p.alive)
        .sort((a, b) => b.territoryCells - a.territoryCells || a.id - b.id);
      const dead = cloned
        .filter((p) => !p.alive)
        .sort((a, b) => this.compareDead(a, b));
      const arr = alive.concat(dead);
      for (let i = 0; i < arr.length; i += 1) {
        arr[i].rank = i + 1;
      }
      return arr;
    }

    compareDead(a, b) {
      const tickA = Number.isFinite(a.deathTick) ? a.deathTick : -1;
      const tickB = Number.isFinite(b.deathTick) ? b.deathTick : -1;
      if (tickA !== tickB) {
        return tickB - tickA;
      }
      if (a.territoryCells !== b.territoryCells) {
        return b.territoryCells - a.territoryCells;
      }
      return a.id - b.id;
    }

    getTitle(summary) {
      if (summary.humanRank === 1) {
        return "胜利";
      }
      if (summary.reason === "human_dead") {
        return "失败";
      }
      return "对局结束";
    }

    getSubtitle(summary) {
      if (summary.reason === "timeout") {
        return "60 秒时间到，按领地面积结算。";
      }
      if (summary.reason === "human_dead") {
        return "玩家已死亡，立即结算。";
      }
      if (summary.reason === "all_eliminated") {
        return "提前全灭，胜负已定。";
      }
      return "本局已结束。";
    }
  }

  ns.ResultSystem = ResultSystem;
})();
