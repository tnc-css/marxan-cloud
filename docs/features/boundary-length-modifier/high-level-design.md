# BLM Calibration - High-level design

Reference to latest (draft) designs:
https://invis.io/G211WEUZFST9#/459986030_Marxan_09a

* BLM calibration can be run *on a scenario*.
* Running a BLM calibration process does not need to block editing or even
  running a scenario, as the outcomes of such a process are merely informative
  for the user.
* It may however be desirable from a UX perspective to inform the user that a
  BLM calibration process is running for a given scenario; this may be used both
  to visually inform the user about the running process (frontend app) and
  possibly to cancel a current calibration process (force-starting a new one
  will need a currently-running one to be cancelled)
* The Marxan solver must be run N (6) times, each time for 10 iterations and
  with one of the N BLM values provided by default in the BLM calibration
  screen, or set there by the user
* It may be desirable to set number of runs N as a config default; this number
  is not expected to change once confirmed, and doing so would have implications
  for the frontend, but it would help to make it a configurable setting at least
  to avoid hardcoding assumptions in the code about the number of runs
* A set of initial recommended BLM values should be calculated *at project
  creation stage* as this depends on the PU size, which will be known once the
  PU grid is set.
* This could be read via an ad-hoc endpoint, or by including this information in
  the project result DTO; probably the former would be preferrable, to avoid
  overloading the project result DTO
* POST endpoint to request a calibration task with specific BLM values (either
  the initial recommended ones, or those set by users)
* user-set values should also be persisted and associated to a scenario: once
  the BLM calibration process has finished the values will also be inferrable
  from the results, but until then there must be a way for the frontend to
  request the latest set values in order to render things even while calibration
  results are pending
* For performance reasons, input .dat file generation should be refactored at
  this stage to use precalculated data (i.e. no on-the-fly geo calculations for
  `pu.dat`, `puvspr.dat`, `bound.dat`, etc. - see
  `docs/marxan/data-computations.md` in
  https://github.com/Vizzuality/marxan-cloud/pull/541); the current approach
  would compound by the number of calibration runs the already very high
  overhead to marxan runs due to the initial generation of these files instead
  of resorting to precalculated data

Two main options for running Marxan N times:

* keep as much as possible of the `MarxanSandboxRunnerService` framework
  * a BLM calibration process would then be equivalent to running Marxan N times
  * some assumptions will need to be made configurable
  * for example, run results should not be persisted to the same db tables as
    "real" runs to avoid mixing up actual run results with BLM calibration run
    results; this could be handled somewhat by tagging each set with their
    origin (BLM calibration or actual scenario run), but this may end up being
    brittle, especially until a stable workflow is in place to allow to handle
    multiple run results for the same scenario, garbage-collect stale results
    data, etc.
* create an ad-hoc, minimal `MarxanSandboxBlmCalibrationRunnerService` focused
  on the task at hand:
  * possibly no need to allow users to cancel the N calibration runs: the BLM
    calibration runner should be fast at least for the overhead parts before and
    after actually running the solver
  * however, at least to avoid having to deal with stale failed runs, it may be
    desirable to start a new calibration process by cancelling a previous one
    (which may still be running or have failed)
  * Marxan could be run N times for 10 iterations in the same workspace, by
    creating N input.dat files that differ only by the `BLM` parameter's value,
    and parsing/saving the results of each run (only cost of the best solution)
  * The Marxan workspace may be set up as N identical clones (except for the
    `input.dat` files, each with a unique `BLM` value) or as a single workspace
    (in which case runs can only happen sequentially)
  * Runs could either be started sequentially (possibly cleaning and reusing the
    `output` folder) or in parallel (this will need the setup of N workspace
    clones, as above)
    * complex Marxan runs may use up significant CPU resources for some time,
      even taking into account the limited number of iterations, so any
      concurrency setting should be carefully considered (e.g. maximum two runs
      concurrently)
    * overall, a sequential setup may be simpler to manage while not
      significantly impacting run times (a future setup using Kubernetes
      workers, if desirable, may allow to run BLM calibration runs faster by
      letting the Kubernetes scheduler scale resources as needed)
    * `SolutionsOutputService` only needs to parse output for best solution and
      its cost, as well as PU selection for the best result: no need to zip
      input and output files, persist individual result rows, etc.

Once the N calibration runs have finished:

* Previous calibration results for the scenario, if they exist, should be
  discarded
* An array of `{ blm: number, score: number}` results should be persisted for
  the scenario (one for each of the N input BLM values)
* An array of sets of selected PU ids should be persisted for the scenario (one
  for each of the N input BLM values)
* Workspace should be cleaned up, as with full Marxan runs (also in case of
  failure)
